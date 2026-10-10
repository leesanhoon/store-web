import { parseArgs } from "node:util";
import { createBackend, type BackendTiming, type RemoteCategory, type RemoteProduct } from "./backend.ts";
import { loadManifest, type ManifestCategory, type ManifestProduct } from "./manifest.ts";
import { OUT_DIR, parseTargetUrl } from "./plan.ts";

// `verify` compares out/manifest.json (what `apply` says it created) with what the target backend
// holds right now. GET and HEAD only: it needs no token and writes no file. Run it after the canary
// and again after the full run.

const IMAGE_TIMEOUT_MS = 30_000;
const HEADERS = ["category", "variants", "tiers", "description", "avatar"];

const USAGE = `Usage: IMPORT_TARGET_URL=<backend origin> node scripts/import-old-site/cli.ts verify

Reads out/manifest.json (written by "apply") and checks, with GET requests only, that everything it
lists is on the target backend:
  - every category it created exists under the same name and parent;
  - every product exists under the same name and category, with the expected variants (capacity and
    diameter), the expected number of price tiers per variant, the same description, and an avatar
    image that answers HTTP 200 with an image/* content type (HEAD, or GET when HEAD is refused).
Prints a table, then every problem, and exits non-zero when anything does not match.
It needs no token and writes no file. Products above the baseline that the manifest does not list are
only reported (an admin may have added them; a blind retry would have duplicated one).

Options:
  -h, --help   show this help`;

export type ImageProbe = { status: number; contentType: string | null };

export type VerifyContext = {
    env: NodeJS.ProcessEnv;
    outDir: string;
    timing: Partial<BackendTiming>;
    /** Test seam: the status and content type of an image URL (HEAD, or GET when the host refuses HEAD). */
    probeImage: (url: URL) => Promise<ImageProbe>;
    log: (line: string) => void;
};

type Row = { kind: "category" | "product"; id: number | null; name: string; cells: string[]; problems: string[] };

function describeError(error: unknown): string {
    if (!(error instanceof Error)) return String(error);
    const code = error.cause instanceof Error ? ((error.cause as NodeJS.ErrnoException).code ?? error.cause.message) : "";
    return code ? `${error.message} (${code})` : error.message;
}

export async function probeImage(url: URL): Promise<ImageProbe> {
    const signal = AbortSignal.timeout(IMAGE_TIMEOUT_MS);
    let response = await fetch(url, { method: "HEAD", signal });
    if (response.status === 405 || response.status === 501) {
        response = await fetch(url, { method: "GET", signal });
        await response.body?.cancel();
    }
    return { status: response.status, contentType: response.headers.get("content-type") };
}

/** What is wrong with the avatar, or null when the image is reachable. */
async function avatarProblem(url: string | null, probe: VerifyContext["probeImage"]): Promise<string | null> {
    if (!url) return "the backend has no avatar image";
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return `the avatar URL is not a URL: ${url}`;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return `the avatar URL is not http(s): ${url}`;
    try {
        const { status, contentType } = await probe(parsed);
        if (status !== 200) return `the avatar answers HTTP ${status}: ${url}`;
        if (!contentType?.startsWith("image/")) return `the avatar is ${contentType ?? "of unknown type"}, not an image: ${url}`;
        return null;
    } catch (error) {
        return `the avatar is unreachable (${describeError(error)}): ${url}`;
    }
}

// A multipart form carries every line break as CRLF, so a multi-line description comes back with CRLF.
const text = (value: string) => value.replace(/\r\n?/g, "\n").trim();

const sizeOf = (variant: { capacityMl: number; diameterMm: number }) => `${variant.capacityMl} ml / ${variant.diameterMm} mm`;

function checkCategory(entry: ManifestCategory, remote: RemoteCategory | undefined): Row {
    const row: Row = { kind: "category", id: entry.id, name: entry.name, cells: ["FAIL", "-", "-", "-", "-"], problems: [] };
    if (entry.id === null || (entry.state !== "created" && entry.state !== "adopted")) {
        row.problems.push(`not settled in the manifest (state ${entry.state})`);
    } else if (!remote) {
        row.problems.push(`#${entry.id} is not on the backend`);
    } else if (remote.name !== entry.name || remote.parentId !== entry.parentId) {
        row.problems.push(`#${entry.id} is "${remote.name}" under #${remote.parentId} on the backend, not "${entry.name}" under #${entry.parentId}`);
    } else {
        row.cells[0] = "ok";
    }
    return row;
}

async function checkProduct(entry: ManifestProduct, remote: RemoteProduct | undefined, probe: VerifyContext["probeImage"]): Promise<Row> {
    const row: Row = { kind: "product", id: entry.id, name: entry.name, cells: ["-", "-", "-", "-", "-"], problems: [] };
    if (entry.id === null || (entry.state !== "created" && entry.state !== "adopted")) {
        row.problems.push(`not settled in the manifest (state ${entry.state})`);
        return row;
    }
    if (!remote) {
        row.problems.push(`#${entry.id} is not on the backend`);
        return row;
    }
    if (remote.name !== entry.name) {
        row.problems.push(`#${entry.id} is named "${remote.name}" on the backend, not "${entry.name}"`);
        return row;
    }

    const { problems } = row;
    row.cells[0] = remote.categoryId === entry.categoryId ? "ok" : "FAIL";
    if (row.cells[0] !== "ok") problems.push(`it is in category #${remote.categoryId}, expected #${entry.categoryId}`);

    let matched = 0;
    let haveTiers = 0;
    let wantTiers = 0;
    for (const wanted of entry.variants) {
        wantTiers += wanted.priceTiers.length;
        const have = remote.variants.find((variant) => variant.capacityMl === wanted.capacityMl && variant.diameterMm === wanted.diameterMm);
        if (!have) {
            problems.push(`there is no variant ${sizeOf(wanted)}`);
            continue;
        }
        matched++;
        haveTiers += have.priceTiers.length;
        if (have.priceTiers.length !== wanted.priceTiers.length) {
            problems.push(`variant ${sizeOf(wanted)} has ${have.priceTiers.length} price tier(s), expected ${wanted.priceTiers.length}`);
        }
    }
    const extra = remote.variants.length - matched;
    if (extra > 0) problems.push(`${extra} variant(s) on the backend are not in the manifest`);
    row.cells[1] = `${matched}/${entry.variants.length}${extra > 0 ? ` +${extra}` : ""}`;
    row.cells[2] = `${haveTiers}/${wantTiers}`;

    const descriptionOk = text(remote.description) === text(entry.description);
    if (!descriptionOk) problems.push("the description differs from the manifest");
    row.cells[3] = descriptionOk ? "ok" : "FAIL";

    const avatar = await avatarProblem(remote.avatarImageUrl, probe);
    if (avatar) problems.push(avatar);
    row.cells[4] = avatar ? "FAIL" : "ok";
    return row;
}

function renderTable(rows: Row[]): string[] {
    const head = ["", "id", "name", ...HEADERS, "result"];
    const body = rows.map((row) => {
        const id = row.id === null ? "-" : `#${row.id}`;
        return [row.kind, id, row.name, ...row.cells, row.problems.length === 0 ? "OK" : "FAIL"];
    });
    const widths = head.map((title, column) => Math.max(title.length, ...body.map((line) => line[column].length)));
    return [head, ...body].map((line) => line.map((cell, column) => cell.padEnd(widths[column])).join("  ").trimEnd());
}

function parseOptions(args: string[]): boolean {
    const { values } = parseArgs({ args, options: { help: { type: "boolean", short: "h" } }, allowPositionals: false });
    if (values.help) console.log(USAGE);
    return !values.help;
}

function defaultContext(): VerifyContext {
    return { env: process.env, outDir: OUT_DIR, timing: {}, probeImage, log: console.log };
}

export async function runVerify(args: string[], ctx: VerifyContext = defaultContext()) {
    if (!parseOptions(args)) return;
    const origin = parseTargetUrl(ctx.env.IMPORT_TARGET_URL);
    const manifest = await loadManifest(ctx.outDir);
    if (!manifest) throw new Error('there is no out/manifest.json; run "apply" first');
    if (manifest.target.origin !== origin.origin) {
        throw new Error(`out/manifest.json is for ${manifest.target.origin}, not ${origin.origin}`);
    }
    if (manifest.products.length === 0) throw new Error("out/manifest.json lists no products, so there is nothing to verify");

    const client = createBackend(origin, null, ctx.timing);
    ctx.log(`Target ${origin.host}: waking the backend up (the first request can take a minute)`);
    await client.health();
    const products = await client.listProducts();
    const categories = await client.listCategories();

    const rows = manifest.categories.map((entry) => checkCategory(entry, categories.find((category) => category.id === entry.id)));
    for (const entry of manifest.products) {
        rows.push(await checkProduct(entry, products.find((product) => product.id === entry.id), ctx.probeImage));
    }
    ctx.log(`Verifying ${manifest.products.length} product(s) and ${manifest.categories.length} categor(ies) of out/manifest.json on ${origin.host}`);
    for (const line of renderTable(rows)) ctx.log(line);

    const known = new Set(manifest.products.flatMap((entry) => (entry.id === null ? [] : [entry.id])));
    const strays = products.filter((product) => product.id > manifest.baseline.maxProductId && !known.has(product.id));
    if (strays.length > 0) {
        const list = strays.map((product) => `#${product.id} "${product.name}"`).join(", ");
        ctx.log(`Note: ${strays.length} product(s) above the baseline are not in the manifest (added by hand, or a duplicate?): ${list}`);
    }

    const failed = rows.filter((row) => row.problems.length > 0);
    for (const row of failed) {
        ctx.log(`Problems with ${row.kind} ${row.id === null ? "" : `#${row.id} `}"${row.name}":`);
        for (const problem of row.problems) ctx.log(`  - ${problem}`);
    }
    if (failed.length > 0) throw new Error(`${failed.length} of ${rows.length} manifest entries do not match ${origin.host} (see above)`);
    ctx.log(`All ${rows.length} manifest entries match ${origin.host}.`);
}
