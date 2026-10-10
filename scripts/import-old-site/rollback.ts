import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
    AuthError,
    BackendError,
    createBackend,
    type Backend,
    type BackendTiming,
    type RemoteCategory,
    type RemoteProduct,
} from "./backend.ts";
import { appendJournal, loadManifest, manifestPath, type Manifest } from "./manifest.ts";
import { OUT_DIR, parseTargetUrl } from "./plan.ts";

// `rollback` undoes what `apply` created, and only that. It deletes an id when ALL of these hold: the
// id is in out/manifest.json, it is above the baseline (so it did not exist before the import), and
// the backend still holds the same name there (nobody renamed or reused it). Products go first, then
// the categories apply created (the backend refuses a category that still has products). Anything
// else is kept and reported. Re-running it is safe: ids that are already gone are skipped without a
// request. Images uploaded to Cloudinary cannot be deleted through the API, so their URLs are listed
// in out/orphan-images.txt for manual cleanup.

const ORPHANS_FILE = "orphan-images.txt";
// Consecutive deletes that got no answer at all (timeout, network): the backend is down, stop waiting on it.
const MAX_SILENT_FAILURES = 3;

const USAGE = `Usage: IMPORT_TARGET_URL=<backend origin> IMPORT_API_TOKEN=<jwt> node scripts/import-old-site/cli.ts rollback [options]

Deletes from the target backend what out/manifest.json says "apply" created: the products first, then the
categories it created. It deletes an id only if the id is in the manifest, is above the baseline and the
backend still holds the same name there; everything else is kept and reported. Run it again to continue
after a failure; ids that are already gone are skipped.
A real run needs ALL of these, otherwise it exits non-zero before any request:
  --rollback              delete
  --confirm-host <host>   the host of IMPORT_TARGET_URL, typed by you
  IMPORT_TARGET_URL       required, no default
  IMPORT_API_TOKEN        an admin JWT, read from the environment only (see "apply --help")
A 401/403 stops it at once; so do ${MAX_SILENT_FAILURES} deletes in a row that get no answer.

Options:
  --rollback              perform the deletes
  --dry-run               list what would be deleted or kept (GET only, needs no token or --confirm-host)
  --confirm-host <host>   see above
  -h, --help              show this help

When everything the manifest lists is gone, out/manifest.json is renamed to
out/manifest.rolled-back-<time>.json, so that "apply" starts from a clean slate instead of believing
those products still exist. out/${ORPHANS_FILE} lists the Cloudinary images left behind. Deletes are
journaled in out/journal.jsonl.`;

export type RollbackContext = {
    env: NodeJS.ProcessEnv;
    outDir: string;
    timing: Partial<BackendTiming>;
    log: (line: string) => void;
};

type Options = { rollback: boolean; dryRun: boolean; confirmHost: string | undefined };

type Kind = "product" | "category";
type Verdict = "delete" | "gone" | "keep";
type Item = { kind: Kind; id: number; label: string; verdict: Verdict; why: string; url: string | null };

/** What the manifest holds for one product or category. `scope` is a category's parent; products have none. */
type Wanted = { id: number | null; name: string; scope: number | null; url: string | null };
type Existing = { id: number; name: string; scope: number | null };

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const sameThing = (a: { name: string; scope: number | null }, b: { name: string; scope: number | null }) =>
    a.name === b.name && a.scope === b.scope;

/** One verdict per manifest entry, newest first: the order to undo them in. */
function decide(kind: Kind, wanted: Wanted[], existing: Existing[], baselineMax: number): Item[] {
    const claimed = new Set(wanted.flatMap((entry) => (entry.id === null ? [] : [entry.id])));
    return wanted.flatMap((entry): Item[] => {
        const item = (id: number, name: string, verdict: Verdict, why = ""): Item => ({
            kind,
            id,
            label: `${kind} #${id} "${name}"`,
            verdict,
            why,
            url: entry.url,
        });
        if (entry.id === null) {
            // No id was ever recorded, so the write may or may not have happened. Only a look-alike is worth a
            // mention, and it is never deleted: it is not an id the manifest holds.
            const why = `it may be the unsettled write of the manifest entry "${entry.name}", which has no id; run "apply" to adopt it, then roll back`;
            return existing
                .filter((have) => have.id > baselineMax && !claimed.has(have.id) && sameThing(have, entry))
                .map((have) => item(have.id, have.name, "keep", why));
        }
        if (entry.id <= baselineMax) {
            return [item(entry.id, entry.name, "keep", "its id is at or below the baseline, so it existed before the import")];
        }
        const have = existing.find((candidate) => candidate.id === entry.id);
        if (!have) return [item(entry.id, entry.name, "gone", "already gone from the backend")];
        if (!sameThing(have, entry)) {
            const parent = have.scope === null ? "" : ` under #${have.scope}`;
            return [item(entry.id, entry.name, "keep", `the backend now has "${have.name}"${parent} there, not what the import created`)];
        }
        return [item(entry.id, entry.name, "delete")];
    });
}

function planItems(manifest: Manifest, products: RemoteProduct[], categories: RemoteCategory[]): Item[] {
    const wantedProducts = manifest.products.map((entry): Wanted => ({ id: entry.id, name: entry.name, scope: null, url: entry.avatar.url }));
    const wantedCategories = manifest.categories.map((entry): Wanted => ({ id: entry.id, name: entry.name, scope: entry.parentId, url: null }));
    const haveProducts = products.map(({ id, name }): Existing => ({ id, name, scope: null }));
    const haveCategories = categories.map(({ id, name, parentId }): Existing => ({ id, name, scope: parentId }));
    return [
        ...decide("product", wantedProducts.reverse(), haveProducts, manifest.baseline.maxProductId),
        ...decide("category", wantedCategories.reverse(), haveCategories, manifest.baseline.maxCategoryId),
    ];
}

function printItems(ctx: RollbackContext, items: Item[]) {
    if (items.length === 0) ctx.log("  nothing: the manifest lists no products or categories");
    for (const item of items) ctx.log(`  ${item.verdict.padEnd(7)} ${item.label}${item.why ? ` (${item.why})` : ""}`);
}

// ---- Gates (no network) --------------------------------------------------------------------

function refusal(problems: string[]): Error {
    const list = problems.map((problem) => `  - ${problem}`).join("\n");
    return new Error(`refusing to roll back, nothing was sent or written:\n${list}`);
}

type Prepared = { origin: URL; manifest: Manifest | null; token: string | null };

/** Evaluates every gate and collects what is wrong, so one run reports all of it. */
async function prepare(options: Options, ctx: RollbackContext): Promise<Prepared> {
    const problems: string[] = [];
    let origin: URL | null = null;
    try {
        origin = parseTargetUrl(ctx.env.IMPORT_TARGET_URL);
    } catch (error) {
        problems.push(errorMessage(error));
    }

    let token: string | null = null;
    if (!options.dryRun) {
        if (!options.rollback) problems.push("--rollback is required to delete anything (--dry-run previews without deleting)");
        if (!options.confirmHost) {
            problems.push("--confirm-host is required: pass the host of IMPORT_TARGET_URL");
        } else if (origin && options.confirmHost.toLowerCase() !== origin.host) {
            problems.push(`--confirm-host ${options.confirmHost} is not the host of IMPORT_TARGET_URL (${origin.host})`);
        }
        token = (ctx.env.IMPORT_API_TOKEN ?? "").trim() || null;
        if (!token) {
            problems.push(
                "IMPORT_API_TOKEN is not set: log in at /account, copy localStorage cup_store_admin_token and export it in your own terminal",
            );
        }
    }

    let manifest: Manifest | null = null;
    try {
        manifest = await loadManifest(ctx.outDir);
    } catch (error) {
        problems.push(errorMessage(error));
    }
    if (manifest && origin && manifest.target.origin !== origin.origin) {
        problems.push(`out/manifest.json is for ${manifest.target.origin}, not ${origin.origin}`);
    }
    if (problems.length > 0 || !origin) throw refusal(problems);
    return { origin, manifest, token };
}

// ---- Deletes -------------------------------------------------------------------------------

type Result = { item: Item; outcome: "deleted" | "gone" | "failed" };

/** Deletes every `delete` item in order and appends each outcome to `results`, so a run that stops half-way still reports what it did. */
async function deleteItems(client: Backend, items: Item[], ctx: RollbackContext, results: Result[]): Promise<void> {
    let silent = 0;
    for (const item of items.filter((candidate) => candidate.verdict === "delete")) {
        const { kind, id } = item;
        await appendJournal(ctx.outDir, { event: "rollback-intent", kind, id });
        let outcome: Result["outcome"] = "deleted";
        let message = "";
        try {
            await (kind === "product" ? client.deleteProduct(id) : client.deleteCategory(id));
            silent = 0;
        } catch (error) {
            // A rejected token, or anything that is not a backend answer (a crash), ends the run as it is.
            if (error instanceof AuthError || !(error instanceof BackendError)) throw error;
            if (error.status === 404) {
                outcome = "gone";
                silent = 0;
            } else {
                outcome = "failed";
                message = error.message;
                silent = error.status === null ? silent + 1 : 0;
            }
        }
        await appendJournal(ctx.outDir, { event: "rollback-result", kind, id, outcome, message: message || undefined });
        results.push({ item, outcome });
        ctx.log(outcome === "failed" ? `  FAILED  ${item.label}: ${message}` : `  ${outcome.padEnd(7)} ${item.label}`);
        if (silent >= MAX_SILENT_FAILURES) {
            throw new Error(`stopping after ${MAX_SILENT_FAILURES} deletes in a row that got no answer; the last one: ${message}`);
        }
    }
}

/** Adds the URLs to out/orphan-images.txt: one per line, sorted, and never twice however often it is re-run. */
async function recordOrphans(outDir: string, urls: string[]): Promise<void> {
    const path = join(outDir, ORPHANS_FILE);
    let known: string[] = [];
    try {
        known = (await readFile(path, "utf8")).split("\n").filter(Boolean);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const all = [...new Set([...known, ...urls])].sort();
    if (all.length > known.length) await writeFile(path, `${all.join("\n")}\n`);
}

function parseOptions(args: string[]): Options | null {
    const { values } = parseArgs({
        args,
        options: {
            rollback: { type: "boolean" },
            "dry-run": { type: "boolean" },
            "confirm-host": { type: "string" },
            help: { type: "boolean", short: "h" },
        },
        allowPositionals: false,
    });
    if (values.help) {
        console.log(USAGE);
        return null;
    }
    if (values.rollback && values["dry-run"]) throw new Error("--rollback and --dry-run contradict each other");
    return { rollback: values.rollback === true, dryRun: values["dry-run"] === true, confirmHost: values["confirm-host"] };
}

function defaultContext(): RollbackContext {
    return { env: process.env, outDir: OUT_DIR, timing: {}, log: console.log };
}

export async function runRollback(args: string[], ctx: RollbackContext = defaultContext()) {
    const options = parseOptions(args);
    if (!options) return;
    const { origin, manifest, token } = await prepare(options, ctx);
    if (!manifest) {
        ctx.log("Nothing to roll back: there is no out/manifest.json (apply never ran, or it was already rolled back).");
        return;
    }

    const client = createBackend(origin, token, ctx.timing);
    ctx.log(`Target ${origin.host}: waking the backend up (the first request can take a minute)`);
    await client.health();
    const items = planItems(manifest, await client.listProducts(), await client.listCategories());
    ctx.log(`${options.dryRun ? "Dry run: what a rollback" : "Rolling back"} of out/manifest.json (plan ${manifest.planSha256}) on ${origin.host}:`);
    printItems(ctx, items);
    if (options.dryRun) {
        ctx.log("Dry run: nothing was deleted. Add --rollback and --confirm-host <host> to delete what is marked delete.");
        return;
    }

    await appendJournal(ctx.outDir, { event: "rollback", planSha256: manifest.planSha256, host: origin.host, items: items.length });
    const results: Result[] = items.filter((item) => item.verdict === "gone").map((item) => ({ item, outcome: "gone" }));
    const orphans = () => results.flatMap(({ item, outcome }) => (item.kind === "product" && item.url && outcome !== "failed" ? [item.url] : []));
    try {
        await deleteItems(client, items, ctx, results);
    } catch (error) {
        await appendJournal(ctx.outDir, { event: "rollback-stop", message: errorMessage(error) });
        throw error;
    } finally {
        await recordOrphans(ctx.outDir, orphans());
    }

    const count = (outcome: Result["outcome"]) => results.filter((result) => result.outcome === outcome).length;
    const kept = items.filter((item) => item.verdict === "keep").length;
    ctx.log(`Done: ${count("deleted")} deleted, ${count("gone")} already gone, ${kept} kept, ${count("failed")} failed.`);
    if (orphans().length > 0) {
        ctx.log(`${orphans().length} image(s) stay on Cloudinary (the API cannot delete them): see out/${ORPHANS_FILE} for manual cleanup.`);
    }
    if (kept + count("failed") > 0) {
        throw new Error(
            `rollback incomplete: ${kept} kept and ${count("failed")} failed (see above); resolve them and run the same command again. ` +
                'Do not run "apply" until it is finished: the manifest still lists everything.',
        );
    }

    const archived = `manifest.rolled-back-${new Date().toISOString().replaceAll(":", "-")}.json`;
    await rename(manifestPath(ctx.outDir), join(ctx.outDir, archived));
    ctx.log(`Everything the manifest lists is gone from ${origin.host}. out/manifest.json is now out/${archived}, so "apply" starts clean.`);
}
