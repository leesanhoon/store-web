import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import {
    AuthError,
    BackendError,
    createBackend,
    type Backend,
    type BackendTiming,
    type NewCategory,
    type NewProduct,
    type RemoteCategory,
    type RemoteProduct,
} from "./backend.ts";
import { imagePath } from "./fetch.ts";
import {
    appendJournal,
    createStore,
    loadBaseline,
    loadManifest,
    saveBaseline,
    type Baseline,
    type EntryState,
    type Manifest,
    type ManifestCategory,
    type ManifestProduct,
    type ManifestStore,
} from "./manifest.ts";
import { hashPlanBody, OUT_DIR, parseTargetUrl, planBody, type Plan, type PlanFamily } from "./plan.ts";

// `apply` writes the plan the owner reviewed (out/plan.json) to the target backend, one product per
// family, in plan order. It is a dry run unless --apply is given AND every gate holds. Nothing is
// ever overwritten or deleted: it only creates. The backend has no unique names and no bulk or
// upsert endpoint, so every write goes through `writeOnce`: the intent is journaled before the
// write, and when the outcome of a write is unknown the backend is asked what it holds (and a
// matching product above the baseline is adopted) before anything is sent again. A POST is never
// blindly retried.

const DECISIONS_PATH = join(import.meta.dirname, "decisions.json");

const MAX_ATTEMPTS = 2;
const MAX_CONSECUTIVE_FAILURES = 3;
// After a timeout the backend may still be finishing the request; give it time before looking.
const SETTLE_MS = 10_000;
const GATEWAY_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
// The base64url alphabet of a JWT; anything else was probably pasted with quotes or a "Bearer " prefix.
const TOKEN_PATTERN = /^[\w.~+/=-]+$/;

const USAGE = `Usage: IMPORT_TARGET_URL=<backend origin> IMPORT_API_TOKEN=<jwt> node scripts/import-old-site/cli.ts apply [options]

Writes the reviewed plan (out/plan.json) to the target backend: first the new child categories the plan
lists, then one product per family in plan order. Without --apply it is a dry run: it prints what it
would do and sends nothing. A real run needs ALL of these, otherwise it exits non-zero before any request:
  --apply
  --confirm-host <host>   the host of IMPORT_TARGET_URL, typed by you
  --plan-sha <sha256>     planSha256 of the out/plan.json you reviewed (and the file must still hash to it)
  decisions.json          resolves every family the plan marks needs-decision or skip-overlap
  IMPORT_TARGET_URL       required, no default
  IMPORT_API_TOKEN        an admin JWT: log in at /account and copy localStorage "cup_store_admin_token".
                          Read from the environment only (never a flag, never written to any file).
  data/images/<id>.jpg    the avatar of every family that will be created (run "fetch --images-only")
A baseline of production (out/baseline.json) is taken before the first write.

Options:
  --apply                 perform the writes
  --dry-run               print what would happen and send nothing (the default)
  --confirm-host <host>   see above
  --plan-sha <sha256>     see above
  --only <familyKey>      apply one family only (the canary), then check it before running the rest
  -h, --help              show this help

decisions.json (next to this script): {"families": {"<familyKey>": {"action": "skip" | "import", "categoryId": <id>}}}
  "categoryId" is only for a family whose plan category is unknown, and must be an existing child category.
Writes out/baseline.json, out/manifest.json (resume state and rollback input) and out/journal.jsonl.
Running the same command again resumes from the manifest and creates nothing twice.`;

export type Decision = { action: "skip" | "import"; categoryId: number | null };
export type Decisions = Map<string, Decision>;

export type ImportItem = {
    kind: "import";
    family: PlanFamily;
    /** An existing category (the plan's, or the one chosen in decisions.json) or a new child category to create. */
    target: { id: number } | { create: NewCategory };
};
export type SkipItem = { kind: "skip"; family: PlanFamily; why: string };
export type WorkItem = ImportItem | SkipItem;

type Avatar = { oldProductId: number; bytes: Buffer; sha256: string };

export type ApplyContext = {
    env: NodeJS.ProcessEnv;
    outDir: string;
    decisionsPath: string;
    /** The JPEG bytes of data/images/<oldProductId>.jpg; throws when it is missing or is not a JPEG. */
    readAvatar: (oldProductId: number) => Promise<Buffer>;
    timing: Partial<BackendTiming> & { settleMs?: number };
    /** Test seam: wraps the real client, e.g. to simulate a crash right after a write. */
    wrapClient?: (client: Backend) => Backend;
    log: (line: string) => void;
};

type Options = { apply: boolean; confirmHost: string | undefined; planSha: string | undefined; only: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const bulletList = (lines: string[]) => lines.map((line) => `  - ${line}`).join("\n");

function refusal(problems: string[], sent: boolean): Error {
    const what = sent ? "no write was made" : "nothing was sent or written";
    return new Error(`refusing to apply, ${what}:\n${bulletList(problems)}`);
}

// ---- Inputs: plan, decisions, images -------------------------------------------------------

function isPlan(value: unknown): value is Plan {
    return (
        isRecord(value) &&
        value.schema === 1 &&
        typeof value.planSha256 === "string" &&
        isRecord(value.target) &&
        typeof value.target.origin === "string" &&
        Array.isArray(value.categoriesToCreate) &&
        Array.isArray(value.families)
    );
}

async function readPlan(path: string): Promise<Plan> {
    let raw: string;
    try {
        raw = await readFile(path, "utf8");
    } catch {
        throw new Error(`there is no plan at ${path}; run "plan" first`);
    }
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error(`${path} is not valid JSON`);
    }
    if (!isPlan(data)) throw new Error(`${path} is not a plan.json written by "plan"`);
    const actual = hashPlanBody(planBody(data));
    if (actual !== data.planSha256) {
        throw new Error(`${path} was changed after "plan" wrote it (it hashes to ${actual}, it says ${data.planSha256}); run "plan" again`);
    }
    return data;
}

type RawDecision = { action: "skip" | "import"; categoryId?: number };

function isDecision(value: unknown): value is RawDecision {
    return (
        isRecord(value) &&
        (value.action === "skip" || value.action === "import") &&
        (value.categoryId === undefined || Number.isInteger(value.categoryId))
    );
}

/** A missing decisions.json is an empty one: every family that needs a decision then blocks the run. */
export async function loadDecisions(path: string): Promise<Decisions> {
    let raw: string;
    try {
        raw = await readFile(path, "utf8");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map();
        throw error;
    }
    const shape = '{"families": {"<familyKey>": {"action": "skip" | "import", "categoryId"?: <integer>}}}';
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error(`${path} is not valid JSON; expected ${shape}`);
    }
    if (!isRecord(data) || !isRecord(data.families)) throw new Error(`${path}: expected ${shape}`);
    const decisions: Decisions = new Map();
    for (const [key, value] of Object.entries(data.families)) {
        if (!isDecision(value)) throw new Error(`${path}: the decision for "${key}" is not valid; expected ${shape}`);
        decisions.set(key, { action: value.action, categoryId: value.categoryId ?? null });
    }
    return decisions;
}

function resolveFamily(plan: Plan, family: PlanFamily, decision: Decision | undefined, problems: string[]): WorkItem {
    const skip = (why: string): SkipItem => ({ kind: "skip", family, why });
    const label = `family "${family.key}"`;
    if (family.action === "deferred") {
        if (decision?.action === "import") problems.push(`${label} is deferred and cannot be imported`);
        return skip("deferred");
    }
    // A plain `create` family needs no decision; the others never run on a guess.
    const action = decision?.action ?? (family.action === "create" ? "import" : null);
    if (action === null) return skip("no decision yet");
    if (action === "skip") return skip("decision: skip");

    const { category } = family;
    if (family.avatarOldProductId === null) problems.push(`${label} has no avatar image`);
    if (category === null) {
        if (decision?.categoryId == null) {
            problems.push(`${label} has no category in the plan; its decision must set "categoryId" to an existing child category`);
            return skip("no category");
        }
        return { kind: "import", family, target: { id: decision.categoryId } };
    }
    if (decision?.categoryId != null) problems.push(`${label} already has a category in the plan; remove "categoryId" from its decision`);
    if (category.id !== null) return { kind: "import", family, target: { id: category.id } };
    if (!plan.categoriesToCreate.some((wanted) => wanted.name === category.name && wanted.parentId === category.parentId)) {
        problems.push(`${label} needs the new category "${category.name}", which the plan does not list for creation`);
    }
    return { kind: "import", family, target: { create: { name: category.name, parentId: category.parentId } } };
}

/**
 * Turns the plan and decisions.json into one item per family, in plan order. Every needs-decision and
 * skip-overlap family needs an entry in decisions.json, whether or not `--only` selects it.
 */
export function resolveWork(plan: Plan, decisions: Decisions, only: string | null): { items: WorkItem[]; problems: string[] } {
    const problems: string[] = [];
    const keys = new Set(plan.families.map((family) => family.key));
    for (const key of decisions.keys()) {
        if (!keys.has(key)) problems.push(`decisions.json lists "${key}", which is not a family of out/plan.json`);
    }
    if (only !== null && !keys.has(only)) problems.push(`--only "${only}" is not a family of out/plan.json`);

    const undecided = plan.families.filter(
        (family) => (family.action === "needs-decision" || family.action === "skip-overlap") && !decisions.has(family.key),
    );
    if (undecided.length > 0) {
        const lines = undecided.map((family) => `${family.key}  [${family.action}] ${family.name}`);
        const list = bulletList(lines).replace(/^/gm, "  ");
        problems.push(`${undecided.length} family(ies) need an entry in decisions.json ("skip" or "import"):\n${list}`);
    }

    const items = plan.families.map((family): WorkItem => {
        const item = resolveFamily(plan, family, decisions.get(family.key), problems);
        return only !== null && family.key !== only ? { kind: "skip", family, why: "not selected by --only" } : item;
    });
    return { items, problems };
}

async function readAvatarFile(oldProductId: number): Promise<Buffer> {
    const path = imagePath(oldProductId);
    let bytes: Buffer;
    try {
        bytes = await readFile(path);
    } catch {
        throw new Error(`${path} is missing; run "fetch --images-only"`);
    }
    if (!bytes.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC) || bytes.length > MAX_IMAGE_BYTES) {
        throw new Error(`${path} is not a JPEG of at most ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
    }
    return bytes;
}

// ---- Gates (no network) --------------------------------------------------------------------

type Prepared = {
    problems: string[];
    plan: Plan | null;
    origin: URL | null;
    token: string;
    items: WorkItem[];
    avatars: Map<number, Avatar>;
    manifest: Manifest | null;
    baseline: Baseline | null;
};

/** Evaluates every gate that needs no network and collects what is wrong, so one run reports all of it. */
async function prepare(options: Options, ctx: ApplyContext): Promise<Prepared> {
    const problems: string[] = [];
    const attempt = async <T>(work: () => T | Promise<T>): Promise<T | null> => {
        try {
            return await work();
        } catch (error) {
            problems.push(errorMessage(error));
            return null;
        }
    };

    const origin = await attempt(() => parseTargetUrl(ctx.env.IMPORT_TARGET_URL));
    const plan = await attempt(() => readPlan(join(ctx.outDir, "plan.json")));
    if (!options.planSha) {
        problems.push("--plan-sha is required: pass the planSha256 of the plan you reviewed");
    } else if (plan && options.planSha !== plan.planSha256) {
        problems.push(`--plan-sha ${options.planSha} is not the planSha256 of out/plan.json (${plan.planSha256})`);
    }
    if (!options.confirmHost) {
        problems.push("--confirm-host is required: pass the host of IMPORT_TARGET_URL");
    } else if (origin && options.confirmHost.toLowerCase() !== origin.host) {
        problems.push(`--confirm-host ${options.confirmHost} is not the host of IMPORT_TARGET_URL (${origin.host})`);
    }
    if (plan && origin && plan.target.origin !== origin.origin) {
        problems.push(`out/plan.json was made for ${plan.target.origin} but IMPORT_TARGET_URL is ${origin.origin}`);
    }

    const token = (ctx.env.IMPORT_API_TOKEN ?? "").trim();
    if (!token) {
        problems.push(
            "IMPORT_API_TOKEN is not set: log in at /account, copy localStorage cup_store_admin_token and export it in your own terminal",
        );
    } else if (!TOKEN_PATTERN.test(token)) {
        problems.push("IMPORT_API_TOKEN does not look like a JWT (only the token itself, no quotes, spaces or Bearer prefix)");
    }

    let items: WorkItem[] = [];
    const decisions = await attempt(() => loadDecisions(ctx.decisionsPath));
    if (plan && decisions) {
        const work = resolveWork(plan, decisions, options.only);
        items = work.items;
        problems.push(...work.problems);
    }

    const avatars = new Map<number, Avatar>();
    for (const item of items) {
        const id = item.kind === "import" ? item.family.avatarOldProductId : null;
        if (id === null || avatars.has(id)) continue;
        const bytes = await attempt(() => ctx.readAvatar(id));
        if (bytes) avatars.set(id, { oldProductId: id, bytes, sha256: createHash("sha256").update(bytes).digest("hex") });
    }

    const manifest = await attempt(() => loadManifest(ctx.outDir));
    const baseline = await attempt(() => loadBaseline(ctx.outDir));
    if (manifest && plan && manifest.planSha256 !== plan.planSha256) {
        problems.push(
            `out/manifest.json belongs to plan ${manifest.planSha256}, not ${plan.planSha256}; finish or roll back that run, ` +
                "or move out/manifest.json, out/baseline.json and out/journal.jsonl aside to start over",
        );
    }
    if (manifest && origin && manifest.target.origin !== origin.origin) {
        problems.push(`out/manifest.json is for ${manifest.target.origin}, not ${origin.origin}`);
    }
    if (manifest && !baseline) problems.push("out/manifest.json exists but out/baseline.json is missing; keep them together");
    return { problems, plan, origin, token, items, avatars, manifest, baseline };
}

function describeTarget(item: ImportItem): string {
    return "id" in item.target ? `category #${item.target.id}` : `new category "${item.target.create.name}"`;
}

function printDryRun(ctx: ApplyContext, prepared: Prepared) {
    const { plan, items, manifest, problems } = prepared;
    ctx.log("Dry run: nothing is sent and nothing is written. Add --apply (and satisfy every gate) to write.");
    if (plan) {
        const created = new Set<string>();
        for (const item of items) {
            if (item.kind !== "import" || !("create" in item.target)) continue;
            created.add(`"${item.target.create.name}" under #${item.target.create.parentId}`);
        }
        ctx.log(`Plan ${plan.planSha256} for ${plan.target.host}: ${plan.families.length} families`);
        ctx.log(`New categories: ${[...created].join(", ") || "none"}`);
        for (const item of items) {
            const done = manifest?.products.find((product) => product.familyKey === item.family.key);
            if (item.kind === "skip") {
                ctx.log(`  skip    ${item.family.name} (${item.why})`);
            } else if (done && (done.state === "created" || done.state === "adopted")) {
                ctx.log(`  done    ${item.family.name} (already ${done.state} as product #${done.id})`);
            } else {
                ctx.log(`  create  ${item.family.name}: ${item.family.variants.length} variant(s) in ${describeTarget(item)}`);
            }
        }
    }
    if (problems.length > 0) ctx.log(`Not ready to apply:\n${bulletList(problems)}`);
}

// ---- Writes --------------------------------------------------------------------------------

/** A family (or its category) the backend refused, or that never got a result. The run goes on with the next one. */
class FamilyFailed extends Error {}

type Run = {
    client: Backend;
    store: ManifestStore;
    outDir: string;
    settleMs: number;
    log: (line: string) => void;
    /** Consecutive failed write requests; the run stops at MAX_CONSECUTIVE_FAILURES. */
    failures: number;
};

type Step<T extends { id: number }> = {
    kind: "category" | "product";
    key: string;
    entry: { state: EntryState; error: string | null };
    /** True when an earlier run may already have sent this write. */
    maybeExists: boolean;
    create: () => Promise<T>;
    /** What the backend holds right now that this write must have produced, if anything. */
    locate: () => Promise<T | null>;
    record: (value: T) => void;
};

const journal = (run: Run, entry: Record<string, unknown>) => appendJournal(run.outDir, entry);

async function writeOnce<T extends { id: number }>(run: Run, step: Step<T>): Promise<{ value: T; state: "created" | "adopted" }> {
    const { entry, kind, key } = step;
    const succeed = async (value: T, state: "created" | "adopted") => {
        step.record(value);
        entry.state = state;
        entry.error = null;
        run.failures = 0;
        await journal(run, { event: "result", kind, key, outcome: state, id: value.id });
        await run.store.save();
        return { value, state };
    };

    if (step.maybeExists) {
        const found = await step.locate();
        if (found) return succeed(found, "adopted");
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await journal(run, { event: "intent", kind, key, attempt });
        entry.state = "pending";
        entry.error = null;
        await run.store.save();
        let created: T;
        try {
            created = await step.create();
        } catch (error) {
            // A rejected token, or anything that is not a backend answer (a crash), ends the run as it is.
            if (!(error instanceof BackendError) || error instanceof AuthError) throw error;
            run.failures++;
            const outcome = error.outcomeUnknown ? "unknown" : "rejected";
            await journal(run, { event: "result", kind, key, outcome, status: error.status, message: error.message });
            if (error.outcomeUnknown) {
                // No answer, or only the gateway answered (502/503/504): the write may still be running upstream.
                if (error.status === null || GATEWAY_STATUSES.has(error.status)) await sleep(run.settleMs);
                const found = await step.locate();
                if (found) return succeed(found, "adopted");
            }
            entry.error = error.message;
            const stop = run.failures >= MAX_CONSECUTIVE_FAILURES;
            if (stop || !error.outcomeUnknown) {
                entry.state = "failed";
                await run.store.save();
                if (stop) {
                    throw new Error(`stopping after ${MAX_CONSECUTIVE_FAILURES} consecutive failed writes; the last one: ${error.message}`);
                }
                throw new FamilyFailed(error.message);
            }
            continue;
        }
        return succeed(created, "created");
    }
    entry.state = "failed";
    await run.store.save();
    throw new FamilyFailed(entry.error ?? `no result after ${MAX_ATTEMPTS} attempts`);
}

async function ensureCategory(run: Run, wanted: NewCategory): Promise<number> {
    const { manifest } = run.store;
    const known = manifest.categories.find((category) => category.name === wanted.name && category.parentId === wanted.parentId);
    if (known && known.id !== null && (known.state === "created" || known.state === "adopted")) return known.id;
    const entry: ManifestCategory = known ?? { ...wanted, id: null, state: "pending", error: null };
    if (!known) manifest.categories.push(entry);
    const claimed = () => new Set(manifest.categories.flatMap((category) => (category.id === null ? [] : [category.id])));
    const { value } = await writeOnce<RemoteCategory>(run, {
        kind: "category",
        key: `${wanted.parentId}/${wanted.name}`,
        entry,
        maybeExists: known !== undefined,
        create: () => run.client.createCategory(wanted),
        locate: async () => {
            const taken = claimed();
            const found = (await run.client.listCategories()).filter(
                (category) =>
                    category.id > manifest.baseline.maxCategoryId &&
                    !taken.has(category.id) &&
                    category.name === wanted.name &&
                    category.parentId === wanted.parentId,
            );
            return found[0] ?? null;
        },
        record: (category) => {
            entry.id = category.id;
        },
    });
    return value.id;
}

function sameSizes(remote: RemoteProduct, entry: ManifestProduct): boolean {
    return (
        remote.variants.length === entry.variants.length &&
        entry.variants.every((wanted) =>
            remote.variants.some((have) => have.capacityMl === wanted.capacityMl && have.diameterMm === wanted.diameterMm),
        )
    );
}

/** The product a lost write created: same name, category and sizes, above the baseline, not already someone's. */
async function locateProduct(run: Run, entry: ManifestProduct): Promise<RemoteProduct | null> {
    const { manifest } = run.store;
    const taken = new Set(manifest.products.flatMap((product) => (product.id === null || product === entry ? [] : [product.id])));
    const matches = (await run.client.listProducts()).filter(
        (remote) =>
            remote.id > manifest.baseline.maxProductId &&
            !taken.has(remote.id) &&
            remote.name === entry.name &&
            remote.categoryId === entry.categoryId &&
            sameSizes(remote, entry),
    );
    if (matches.length > 1) {
        const ids = matches.map((match) => `#${match.id}`).join(", ");
        throw new Error(`products ${ids} all look like "${entry.name}"; not adopting any of them, please look at the backend by hand`);
    }
    return matches[0] ?? null;
}

function newProductEntry(family: PlanFamily, categoryId: number, avatar: Avatar): ManifestProduct {
    return {
        familyKey: family.key,
        name: family.name,
        description: family.description,
        categoryId,
        state: "pending",
        id: null,
        variants: family.variants.map((variant) => ({
            id: null,
            capacityMl: variant.capacityMl,
            diameterMm: variant.diameterMm,
            priceTiers: variant.priceTiers.map(({ minQuantity, unitPrice }) => ({ minQuantity, unitPrice })),
            source: { oldProductId: variant.source.productId, oldVariationId: variant.source.variationId, slug: variant.source.slug },
        })),
        avatar: { oldProductId: avatar.oldProductId, sha256: avatar.sha256, url: null },
        error: null,
    };
}

function payloadOf(entry: ManifestProduct, avatar: Avatar): NewProduct {
    return {
        name: entry.name,
        description: entry.description,
        categoryId: entry.categoryId,
        variants: entry.variants.map(({ capacityMl, diameterMm, priceTiers }) => ({ capacityMl, diameterMm, priceTiers })),
        avatar: { fileName: `${entry.avatar.oldProductId}.jpg`, bytes: avatar.bytes },
    };
}

type Imported = ManifestProduct & { outcome: "created" | "adopted" | "present" };

async function importFamily(run: Run, item: ImportItem, avatar: Avatar): Promise<Imported> {
    const { family } = item;
    const { manifest } = run.store;
    const known = manifest.products.find((product) => product.familyKey === family.key);
    if (known && (known.state === "created" || known.state === "adopted")) return { ...known, outcome: "present" };

    const categoryId = "create" in item.target ? await ensureCategory(run, item.target.create) : item.target.id;
    if (known && known.categoryId !== categoryId) {
        throw new Error(
            `out/manifest.json recorded "${family.name}" in category #${known.categoryId} but it now resolves to #${categoryId}; ` +
                "restore the earlier decision, or check the backend and then move the manifest aside",
        );
    }
    const entry = known ?? newProductEntry(family, categoryId, avatar);
    if (!known) manifest.products.push(entry);
    const { state } = await writeOnce<RemoteProduct>(run, {
        kind: "product",
        key: family.key,
        entry,
        maybeExists: known !== undefined,
        create: () => run.client.createProduct(payloadOf(entry, avatar)),
        locate: () => locateProduct(run, entry),
        record: (remote) => {
            entry.id = remote.id;
            entry.avatar.url = remote.avatarImageUrl;
            for (const variant of entry.variants) {
                const same = (have: { capacityMl: number; diameterMm: number }) =>
                    have.capacityMl === variant.capacityMl && have.diameterMm === variant.diameterMm;
                variant.id = remote.variants.find(same)?.id ?? null;
            }
        },
    });
    return { ...entry, outcome: state };
}

// ---- Run -----------------------------------------------------------------------------------

async function takeBaseline(client: Backend, origin: URL): Promise<Baseline> {
    const products = await client.listProducts();
    const categories = await client.listCategories();
    return {
        schema: 1,
        takenAt: new Date().toISOString(),
        target: { origin: origin.origin, host: origin.host },
        products: products.map(({ id, name, categoryId }) => ({ id, name, categoryId })),
        categories,
    };
}

const maxId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((row) => row.id));

/** The plan's overlap analysis only holds for the production it was made against. */
function baselineProblems(baseline: Baseline, plan: Plan, items: WorkItem[]): string[] {
    const problems: string[] = [];
    const { target } = plan;
    if (
        baseline.products.length !== target.productCount ||
        baseline.categories.length !== target.categoryCount ||
        maxId(baseline.products) !== target.maxProductId
    ) {
        problems.push(
            `${target.host} changed since the plan was made (plan: ${target.productCount} products, ${target.categoryCount} categories, ` +
                `max product id ${target.maxProductId}; baseline: ${baseline.products.length}, ${baseline.categories.length}, ` +
                `${maxId(baseline.products)}); ` +
                'run "plan" again and review it, or remove out/baseline.json if it is stale',
        );
    }
    for (const item of items) {
        if (item.kind !== "import" || !("id" in item.target)) continue;
        const { id } = item.target;
        const category = baseline.categories.find((candidate) => candidate.id === id);
        const label = `"${item.family.name}": category #${id}`;
        if (!category) problems.push(`${label} does not exist on ${target.host}`);
        else if (category.parentId === null) problems.push(`${label} is a root category, use one of its children`);
    }
    return problems;
}

function newManifest(plan: Plan, origin: URL, baseline: Baseline): Manifest {
    const now = new Date().toISOString();
    return {
        schema: 1,
        target: { origin: origin.origin, host: origin.host },
        planSha256: plan.planSha256,
        createdAt: now,
        updatedAt: now,
        baseline: { maxProductId: maxId(baseline.products), maxCategoryId: maxId(baseline.categories) },
        categories: [],
        products: [],
    };
}

async function execute(input: Prepared & { plan: Plan; origin: URL }, ctx: ApplyContext) {
    const { plan, origin, items, avatars } = input;
    const real = createBackend(origin, input.token, ctx.timing);
    const client = ctx.wrapClient ? ctx.wrapClient(real) : real;
    ctx.log(`Target ${origin.host}: waking the backend up (the first request can take a minute)`);
    await client.health();

    await mkdir(ctx.outDir, { recursive: true });
    const baseline = input.baseline ?? (await takeBaseline(client, origin));
    const problems = baselineProblems(baseline, plan, items);
    if (problems.length > 0) throw refusal(problems, true);
    if (!input.baseline) await saveBaseline(ctx.outDir, baseline);

    const store = createStore(ctx.outDir, input.manifest ?? newManifest(plan, origin, baseline));
    await store.save();
    const run: Run = { client, store, outDir: ctx.outDir, settleMs: ctx.timing.settleMs ?? SETTLE_MS, log: ctx.log, failures: 0 };
    const todo = items.filter((item) => item.kind === "import");
    await journal(run, { event: "run", planSha256: plan.planSha256, host: origin.host, families: todo.length });

    const counts = { created: 0, adopted: 0, present: 0, failed: 0 };
    try {
        for (const [index, item] of todo.entries()) {
            const label = `[${index + 1}/${todo.length}] ${item.family.name}`;
            const avatarId = item.family.avatarOldProductId;
            const avatar = avatarId === null ? undefined : avatars.get(avatarId);
            if (!avatar) throw new Error(`${label}: the avatar image was not loaded`);
            try {
                const done = await importFamily(run, item, avatar);
                counts[done.outcome]++;
                ctx.log(`${label}: ${done.outcome === "present" ? "already done" : done.outcome} as product #${done.id}`);
            } catch (error) {
                if (!(error instanceof FamilyFailed)) throw error;
                counts.failed++;
                ctx.log(`${label}: FAILED, ${error.message}`);
            }
        }
    } catch (error) {
        await journal(run, { event: "stop", message: errorMessage(error) });
        throw error;
    }

    const selected = new Set(todo.map((item) => item.family.key));
    const unsettled = store.manifest.products.filter(
        (product) => (product.state === "pending" || product.state === "failed") && !selected.has(product.familyKey),
    );
    if (unsettled.length > 0) {
        const names = unsettled.map((product) => `"${product.name}"`).join(", ");
        const verb = unsettled.length === 1 ? "is" : "are";
        ctx.log(
            `Warning: ${names} ${verb} still unsettled in out/manifest.json and not part of this run; ` +
                "include them in a run (drop --only or change their decision) to settle them",
        );
    }

    const skipped = items.length - todo.length;
    ctx.log(
        `Done: ${counts.created} created, ${counts.adopted} adopted, ${counts.present} already done, ` +
            `${skipped} skipped, ${counts.failed} failed. Manifest: out/manifest.json, journal: out/journal.jsonl`,
    );
    if (counts.failed > 0) {
        const retry = "run the same command again to retry only those";
        throw new Error(`${counts.failed} family(ies) failed (see above and out/journal.jsonl); ${retry}`);
    }
}

function parseOptions(args: string[]): Options | null {
    const { values } = parseArgs({
        args,
        options: {
            apply: { type: "boolean" },
            "dry-run": { type: "boolean" },
            "confirm-host": { type: "string" },
            "plan-sha": { type: "string" },
            only: { type: "string" },
            help: { type: "boolean", short: "h" },
        },
        allowPositionals: false,
    });
    if (values.help) {
        console.log(USAGE);
        return null;
    }
    if (values.apply && values["dry-run"]) throw new Error("--apply and --dry-run contradict each other");
    return { apply: values.apply === true, confirmHost: values["confirm-host"], planSha: values["plan-sha"], only: values.only ?? null };
}

function defaultContext(): ApplyContext {
    return {
        env: process.env,
        outDir: OUT_DIR,
        decisionsPath: DECISIONS_PATH,
        readAvatar: readAvatarFile,
        timing: {},
        log: console.log,
    };
}

export async function runApply(args: string[], ctx: ApplyContext = defaultContext()) {
    const options = parseOptions(args);
    if (!options) return;
    const prepared = await prepare(options, ctx);
    if (!options.apply) {
        printDryRun(ctx, prepared);
        return;
    }
    const { problems, plan, origin } = prepared;
    if (problems.length > 0 || !plan || !origin) throw refusal(problems, false);
    await execute({ ...prepared, plan, origin }, ctx);
}
