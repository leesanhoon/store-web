import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { getBuffer, getJson, OLD_ORIGIN } from "./old-http.ts";

const DATA_DIR = join(import.meta.dirname, "data");
const IMAGES_DIR = join(DATA_DIR, "images");

export const SNAPSHOT_PATH = join(DATA_DIR, "snapshot.json");

const PRODUCTS_PATH = "/wp-json/wc/store/v1/products?per_page=100";
const VARIATIONS_PATH = "/wp-json/wc/store/v1/products?type=variation&per_page=100";
const CATEGORIES_PATH = "/wp-json/wc/store/v1/products/categories?per_page=100";
const YOAST_PATH = "/wp-json/wp/v2/product?per_page=100&_fields=id,slug,link,title,status,yoast_head_json";

const EXPECTED_PRODUCTS = 62;
const EXPECTED_VARIATIONS = 99;
const MAX_PAGES = 10;
const MIN_IMAGE_BYTES = 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

const USAGE = `Usage: node scripts/import-old-site/cli.ts fetch [--images-only]

Downloads the old catalog from ${OLD_ORIGIN} (GET only) into data/snapshot.json
and the product images into data/images/ (gitignored).

Options:
  --images-only  keep the committed snapshot and only download the missing images
  -h, --help     show this help`;

type JsonRecord = Record<string, unknown>;
type Row = JsonRecord & { id: number };
export type StoreItem = Row & { prices: { currency_minor_unit: number } };

export type Snapshot = {
    fetchedAt: string;
    source: string;
    products: StoreItem[];
    variations: StoreItem[];
    categories: Row[];
    yoast: Row[];
};

export function imagePath(productId: number): string {
    return join(IMAGES_DIR, `${productId}.jpg`);
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRow(value: unknown): value is Row {
    return isRecord(value) && Number.isInteger(value.id);
}

function isStoreItem(value: unknown): value is StoreItem {
    return isRow(value) && isRecord(value.prices) && typeof value.prices.currency_minor_unit === "number";
}

function parseRows<T extends Row>(label: string, data: unknown, isValid: (value: unknown) => value is T): T[] {
    if (!Array.isArray(data) || !data.every(isValid)) {
        throw new Error(`${label}: expected a JSON array of objects with the documented fields`);
    }
    return data;
}

function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (!isRecord(value)) return value;
    return Object.fromEntries(
        Object.keys(value)
            .sort()
            .map((key) => [key, sortKeys(value[key])]),
    );
}

function normalizeRows<T extends Row>(rows: T[]): T[] {
    return rows.map((row) => sortKeys(row) as T).sort((a, b) => a.id - b.id);
}

async function getAllPages<T extends Row>(
    label: string,
    path: string,
    isValid: (value: unknown) => value is T,
): Promise<T[]> {
    const first = await getJson(`${path}&page=1`);
    if (first.totalPages > MAX_PAGES) {
        throw new Error(`${label}: the server reports ${first.totalPages} pages, more than the ${MAX_PAGES} expected`);
    }
    const pages = [first.data];
    for (let page = 2; page <= first.totalPages; page++) {
        pages.push((await getJson(`${path}&page=${page}`)).data);
    }
    const rows = normalizeRows(pages.flatMap((data) => parseRows(label, data, isValid)));
    console.log(`  ${label}: ${rows.length}`);
    return rows;
}

function assertWholeCurrency(label: string, items: StoreItem[]) {
    const offenders = items.filter((item) => item.prices.currency_minor_unit !== 0);
    if (offenders.length > 0) {
        const ids = offenders.map((item) => item.id).join(", ");
        throw new Error(`${label}: currency_minor_unit is not 0 for ids ${ids}; the import assumes whole-VND prices`);
    }
}

function warnOnCountDrift(label: string, actual: number, expected: number) {
    if (actual !== expected) console.warn(`warning: expected ${expected} ${label} but found ${actual}`);
}

async function writeFileAtomic(path: string, data: string | Buffer) {
    const temporary = `${path}.tmp`;
    await writeFile(temporary, data);
    await rename(temporary, path);
}

async function fetchSnapshot(): Promise<Snapshot> {
    console.log(`Fetching the old catalog from ${OLD_ORIGIN} (GET only, certificate check off for this host only)`);
    const products = await getAllPages("products", PRODUCTS_PATH, isStoreItem);
    const variations = await getAllPages("variations", VARIATIONS_PATH, isStoreItem);
    const categories = await getAllPages("categories", CATEGORIES_PATH, isRow);
    const yoast = await getAllPages("yoast", YOAST_PATH, isRow);

    assertWholeCurrency("products", products);
    assertWholeCurrency("variations", variations);
    warnOnCountDrift("products", products.length, EXPECTED_PRODUCTS);
    warnOnCountDrift("variations", variations.length, EXPECTED_VARIATIONS);

    return { fetchedAt: new Date().toISOString(), source: OLD_ORIGIN, products, variations, categories, yoast };
}

export async function loadSnapshot(): Promise<Snapshot> {
    let raw: string;
    try {
        raw = await readFile(SNAPSHOT_PATH, "utf8");
    } catch {
        throw new Error(`No snapshot at ${SNAPSHOT_PATH}; run "fetch" without --images-only first`);
    }
    const snapshot = JSON.parse(raw) as Snapshot;
    parseRows("snapshot.products", snapshot.products, isStoreItem);
    return snapshot;
}

function avatarUrl(product: StoreItem): string | null {
    const first = Array.isArray(product.images) ? product.images[0] : undefined;
    return isRecord(first) && typeof first.src === "string" ? first.src : null;
}

function imageProblem(body: Buffer, contentType: string): string | null {
    if (!contentType.toLowerCase().startsWith("image/")) return `content-type is "${contentType}", expected image/*`;
    if (body.length < MIN_IMAGE_BYTES || body.length > MAX_IMAGE_BYTES) {
        return `size ${body.length} bytes is outside ${MIN_IMAGE_BYTES}..${MAX_IMAGE_BYTES}`;
    }
    if (!body.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) return "not a JPEG (magic bytes do not match)";
    return null;
}

async function hasValidImage(productId: number): Promise<boolean> {
    try {
        return imageProblem(await readFile(imagePath(productId)), "image/jpeg") === null;
    } catch {
        return false;
    }
}

async function downloadImage(product: StoreItem) {
    const src = avatarUrl(product);
    if (!src) throw new Error("the Store API lists no image");
    const { body, contentType } = await getBuffer(src);
    const problem = imageProblem(body, contentType);
    if (problem) throw new Error(problem);
    await writeFileAtomic(imagePath(product.id), body);
}

async function downloadImages(products: StoreItem[]) {
    await mkdir(IMAGES_DIR, { recursive: true });
    const failedIds: number[] = [];
    let downloaded = 0;
    let present = 0;
    for (const [index, product] of products.entries()) {
        const label = `  [${index + 1}/${products.length}] product ${product.id}`;
        if (await hasValidImage(product.id)) {
            present++;
            continue;
        }
        try {
            await downloadImage(product);
            downloaded++;
            console.log(`${label}: downloaded`);
        } catch (error) {
            failedIds.push(product.id);
            console.warn(`${label}: FAILED, ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    console.log(`Images: ${downloaded} downloaded, ${present} already present, ${failedIds.length} failed`);
    if (failedIds.length > 0) {
        throw new Error(`${failedIds.length} image(s) failed (product ids ${failedIds.join(", ")}); re-run with --images-only`);
    }
}

export async function runFetch(args: string[]) {
    const { values } = parseArgs({
        args,
        options: { "images-only": { type: "boolean" }, help: { type: "boolean", short: "h" } },
        allowPositionals: false,
    });
    if (values.help) {
        console.log(USAGE);
        return;
    }

    let snapshot: Snapshot;
    if (values["images-only"]) {
        snapshot = await loadSnapshot();
    } else {
        snapshot = await fetchSnapshot();
        await mkdir(DATA_DIR, { recursive: true });
        await writeFileAtomic(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
        console.log(`Wrote ${SNAPSHOT_PATH}`);
    }
    await downloadImages(snapshot.products);
}
