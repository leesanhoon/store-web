import { open, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RemoteCategory, RemoteTier } from "./backend.ts";

// What `apply` leaves in out/ (all gitignored, none of it ever holds the API token):
//  - baseline.json: ids and names of production's products and categories, taken before the first write;
//  - manifest.json: the resume state and the rollback input: old product/variation ids -> new ids,
//    the categories it created and the uploaded image URLs (Cloudinary keeps those even after a delete);
//  - journal.jsonl: append-only audit log, one line per event, fsynced; an `intent` is appended before every write.

/**
 * pending: the write was (or is about to be) sent and its outcome is not known: reconcile before writing again.
 * failed: the backend rejected it, or every attempt ended without a result. created / adopted: it exists, `id` is set.
 */
export type EntryState = "pending" | "failed" | "created" | "adopted";

export type ManifestSource = { oldProductId: number; oldVariationId: number | null; slug: string };
export type ManifestVariant = {
    /** The new variant id, when the backend returned one. */
    id: number | null;
    capacityMl: number;
    diameterMm: number;
    priceTiers: RemoteTier[];
    source: ManifestSource;
};
export type ManifestProduct = {
    familyKey: string;
    name: string;
    description: string;
    categoryId: number;
    state: EntryState;
    /** The new product id; null until it is created or adopted. */
    id: number | null;
    variants: ManifestVariant[];
    avatar: { oldProductId: number; sha256: string; url: string | null };
    error: string | null;
};
export type ManifestCategory = {
    name: string;
    parentId: number;
    state: EntryState;
    id: number | null;
    error: string | null;
};

export type Manifest = {
    schema: 1;
    target: { origin: string; host: string };
    planSha256: string;
    createdAt: string;
    updatedAt: string;
    /** Rollback only touches ids above these: everything at or below them existed before the import. */
    baseline: { maxProductId: number; maxCategoryId: number };
    categories: ManifestCategory[];
    products: ManifestProduct[];
};

export type Baseline = {
    schema: 1;
    takenAt: string;
    target: { origin: string; host: string };
    products: Array<{ id: number; name: string; categoryId: number }>;
    categories: RemoteCategory[];
};

export type ManifestStore = { manifest: Manifest; save: () => Promise<void> };

export const baselinePath = (outDir: string) => join(outDir, "baseline.json");
export const manifestPath = (outDir: string) => join(outDir, "manifest.json");
export const journalPath = (outDir: string) => join(outDir, "journal.jsonl");

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTarget(value: unknown): boolean {
    return isRecord(value) && typeof value.origin === "string" && typeof value.host === "string";
}

function isBaseline(value: unknown): value is Baseline {
    return (
        isRecord(value) &&
        value.schema === 1 &&
        isTarget(value.target) &&
        Array.isArray(value.products) &&
        Array.isArray(value.categories)
    );
}

function isManifest(value: unknown): value is Manifest {
    return (
        isRecord(value) &&
        value.schema === 1 &&
        isTarget(value.target) &&
        typeof value.planSha256 === "string" &&
        isRecord(value.baseline) &&
        typeof value.baseline.maxProductId === "number" &&
        typeof value.baseline.maxCategoryId === "number" &&
        Array.isArray(value.categories) &&
        Array.isArray(value.products)
    );
}

/** Null when the file does not exist; a file that exists but is not valid JSON is an error. */
async function readJson(path: string): Promise<unknown> {
    let raw: string;
    try {
        raw = await readFile(path, "utf8");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
    }
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(`${path} is not valid JSON`);
    }
}

async function writeJsonAtomic(path: string, data: unknown) {
    const temporary = `${path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
    await rename(temporary, path);
}

export async function loadBaseline(outDir: string): Promise<Baseline | null> {
    const path = baselinePath(outDir);
    const data = await readJson(path);
    if (data !== null && !isBaseline(data)) throw new Error(`${path} is not a baseline written by "apply"`);
    return data;
}

export const saveBaseline = (outDir: string, baseline: Baseline) => writeJsonAtomic(baselinePath(outDir), baseline);

export async function loadManifest(outDir: string): Promise<Manifest | null> {
    const path = manifestPath(outDir);
    const data = await readJson(path);
    if (data !== null && !isManifest(data)) throw new Error(`${path} is not a manifest written by "apply"`);
    return data;
}

/** `save()` rewrites the whole manifest atomically (temporary file, then rename). */
export function createStore(outDir: string, manifest: Manifest): ManifestStore {
    return {
        manifest,
        save: () => {
            manifest.updatedAt = new Date().toISOString();
            return writeJsonAtomic(manifestPath(outDir), manifest);
        },
    };
}

/** Appends one JSON line and fsyncs it, so an `intent` is on disk before the write it announces. */
export async function appendJournal(outDir: string, entry: Record<string, unknown>) {
    const handle = await open(journalPath(outDir), "a");
    try {
        await handle.appendFile(`${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
        await handle.sync();
    } finally {
        await handle.close();
    }
}
