import { setTimeout as sleep } from "node:timers/promises";

// Minimal typed client for the store backend (contract: audits/C-new-import-surface.md).
//  - The bearer token is sent on writes only, is never logged or persisted, and is scrubbed from
//    every error message. Redirects are errors, so an Authorization header can never follow one.
//  - Strictly sequential: a gap before every request. GETs are retried, writes never are: after a
//    write whose outcome is unknown the caller must look at the backend (reconcile) before retrying.

export type BackendTiming = {
    gapMs: number;
    readTimeoutMs: number;
    writeTimeoutMs: number;
    warmUpTimeoutMs: number;
    warmUpAttempts: number;
    readAttempts: number;
    retryDelayMs: number;
};

export const DEFAULT_TIMING: BackendTiming = {
    gapMs: 300,
    readTimeoutMs: 30_000,
    writeTimeoutMs: 120_000,
    // Render's free tier can need 30-60 s to wake up.
    warmUpTimeoutMs: 60_000,
    warmUpAttempts: 5,
    readAttempts: 3,
    retryDelayMs: 2_000,
};

export type RemoteTier = { minQuantity: number; unitPrice: number };
export type RemoteVariant = { id: number | null; capacityMl: number; diameterMm: number; priceTiers: RemoteTier[] };
export type RemoteProduct = {
    id: number;
    name: string;
    description: string;
    categoryId: number;
    avatarImageUrl: string | null;
    variants: RemoteVariant[];
};
export type RemoteCategory = { id: number; name: string; parentId: number | null };

export type NewCategory = { name: string; parentId: number };
export type NewProduct = {
    name: string;
    description: string;
    categoryId: number;
    variants: Array<{ capacityMl: number; diameterMm: number; priceTiers: RemoteTier[] }>;
    /** Sent as the multipart `AvatarImage` file. */
    avatar: { fileName: string; bytes: Uint8Array };
};

export type Backend = {
    /** GET /health with the warm-up retries; resolves once the backend answers. */
    health(): Promise<void>;
    listProducts(): Promise<RemoteProduct[]>;
    listCategories(): Promise<RemoteCategory[]>;
    createCategory(input: NewCategory): Promise<RemoteCategory>;
    createProduct(input: NewProduct): Promise<RemoteProduct>;
    deleteProduct(id: number): Promise<void>;
    deleteCategory(id: number): Promise<void>;
};

export class BackendError extends Error {
    /** HTTP status, or null when no response arrived (timeout, network failure). */
    status: number | null;
    /**
     * True when a write may have taken effect anyway: no response, a 5xx, or a 2xx that could not be
     * read. The caller must reconcile before it writes again. For a GET it just means "transient".
     */
    outcomeUnknown: boolean;

    constructor(message: string, status: number | null, outcomeUnknown: boolean) {
        super(message);
        this.name = "BackendError";
        this.status = status;
        this.outcomeUnknown = outcomeUnknown;
    }
}

/** HTTP 401 or 403: the token is missing, expired or not an admin token. Never retried. */
export class AuthError extends BackendError {
    constructor(message: string, status: number) {
        super(message, status, false);
        this.name = "AuthError";
    }
}

const PRODUCTS_PATH = "/api/v1/Products";
const CATEGORIES_PATH = "/api/v1/Categories";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_BODY_SNIPPET = 300;

type JsonRecord = Record<string, unknown>;
type Reply = { status: number; text: string };

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unexpected(what: string): BackendError {
    return new BackendError(`unexpected ${what} in the backend response`, null, false);
}

function parseTier(value: unknown): RemoteTier {
    if (!isRecord(value) || typeof value.minQuantity !== "number" || typeof value.unitPrice !== "number") {
        throw unexpected("price tier");
    }
    return { minQuantity: value.minQuantity, unitPrice: value.unitPrice };
}

function parseVariant(value: unknown): RemoteVariant {
    if (!isRecord(value) || typeof value.capacityMl !== "number" || typeof value.diameterMm !== "number") {
        throw unexpected("variant");
    }
    const tiers: unknown[] = Array.isArray(value.priceTiers) ? value.priceTiers : [];
    return {
        id: typeof value.id === "number" ? value.id : null,
        capacityMl: value.capacityMl,
        diameterMm: value.diameterMm,
        priceTiers: tiers.map(parseTier),
    };
}

function parseProduct(value: unknown): RemoteProduct {
    if (
        !isRecord(value) ||
        typeof value.id !== "number" ||
        typeof value.name !== "string" ||
        typeof value.categoryId !== "number"
    ) {
        throw unexpected("product");
    }
    const variants: unknown[] = Array.isArray(value.variants) ? value.variants : [];
    return {
        id: value.id,
        name: value.name,
        description: typeof value.description === "string" ? value.description : "",
        categoryId: value.categoryId,
        avatarImageUrl: typeof value.avatarImageUrl === "string" ? value.avatarImageUrl : null,
        variants: variants.map(parseVariant),
    };
}

function parseCategory(value: unknown): RemoteCategory {
    if (!isRecord(value) || typeof value.id !== "number" || typeof value.name !== "string") throw unexpected("category");
    return { id: value.id, name: value.name, parentId: typeof value.parentId === "number" ? value.parentId : null };
}

function describeError(error: unknown): string {
    if (!(error instanceof Error)) return String(error);
    const code = error.cause instanceof Error ? ((error.cause as NodeJS.ErrnoException).code ?? error.cause.message) : "";
    return code ? `${error.message} (${code})` : error.message;
}

/** `token` may be null for a client that only reads. Every method is sequential; do not call two at once. */
export function createBackend(origin: URL, token: string | null, overrides: Partial<BackendTiming> = {}): Backend {
    const timing = { ...DEFAULT_TIMING, ...overrides };
    let lastRequestAt = 0;

    const redact = (text: string) => (token ? text.replaceAll(token, "[redacted]") : text);

    async function request(
        method: string,
        path: string,
        init: { body?: string | FormData; timeoutMs: number; authorize: boolean },
    ): Promise<Reply> {
        if (init.authorize && !token) throw new Error("a write needs the API token (IMPORT_API_TOKEN)");
        const wait = lastRequestAt + timing.gapMs - Date.now();
        if (wait > 0) await sleep(wait);
        const url = new URL(path, origin);
        const signal = AbortSignal.timeout(init.timeoutMs);
        const headers: Record<string, string> = { accept: "application/json" };
        if (init.authorize) headers.authorization = `Bearer ${token}`;
        if (typeof init.body === "string") headers["content-type"] = "application/json";
        try {
            const response = await fetch(url, { method, headers, body: init.body, redirect: "error", signal });
            return { status: response.status, text: await response.text() };
        } catch (error) {
            const reason = signal.aborted ? `timed out after ${init.timeoutMs / 1000} s` : describeError(error);
            throw new BackendError(redact(`${method} ${url.pathname} failed: ${reason}`), null, true);
        } finally {
            lastRequestAt = Date.now();
        }
    }

    function check(method: string, path: string, reply: Reply): Reply {
        if (reply.status >= 200 && reply.status < 300) return reply;
        const snippet = redact(reply.text.replace(/\s+/g, " ").trim().slice(0, MAX_BODY_SNIPPET));
        const message = `${method} ${path} returned HTTP ${reply.status}${snippet ? `: ${snippet}` : ""}`;
        if (reply.status === 401 || reply.status === 403) {
            const hint = "the API token is expired or not an admin token; export a fresh IMPORT_API_TOKEN and run again";
            throw new AuthError(`${message} (${hint})`, reply.status);
        }
        throw new BackendError(message, reply.status, reply.status >= 500);
    }

    async function get(path: string, timeoutMs = timing.readTimeoutMs, attempts = timing.readAttempts): Promise<string> {
        for (let attempt = 1; ; attempt++) {
            try {
                return check("GET", path, await request("GET", path, { timeoutMs, authorize: false })).text;
            } catch (error) {
                if (!(error instanceof BackendError) || !error.outcomeUnknown || attempt >= attempts) throw error;
                await sleep(timing.retryDelayMs * attempt);
            }
        }
    }

    async function write(method: string, path: string, body?: string | FormData): Promise<Reply> {
        return check(method, path, await request(method, path, { body, timeoutMs: timing.writeTimeoutMs, authorize: true }));
    }

    /** The write went through (2xx); an unreadable body must not be mistaken for a failed write. */
    function readCreated<T>(reply: Reply, what: string, parse: (value: unknown) => T): T {
        try {
            return parse(JSON.parse(reply.text));
        } catch {
            throw new BackendError(`${what}: the backend accepted the request but sent no readable result`, reply.status, true);
        }
    }

    async function listAll<T>(path: string, parse: (value: unknown) => T): Promise<T[]> {
        const items: T[] = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
            let data: unknown;
            try {
                data = JSON.parse(await get(`${path}?page=${page}&pageSize=${PAGE_SIZE}`));
            } catch (error) {
                if (error instanceof BackendError) throw error;
                throw new BackendError(`GET ${path} did not return JSON`, null, false);
            }
            const payload = isRecord(data) ? data.items : data;
            if (!Array.isArray(payload)) throw unexpected("collection");
            items.push(...payload.map(parse));
            // A bare array is the whole collection; a paged object says how many items exist in total.
            if (!isRecord(data)) return items;
            const total = data.totalCount;
            if (payload.length === 0 || (typeof total === "number" ? items.length >= total : payload.length < PAGE_SIZE)) {
                return items;
            }
        }
        throw new BackendError(`GET ${path}: more than ${MAX_PAGES} pages`, null, false);
    }

    return {
        async health() {
            await get("/health", timing.warmUpTimeoutMs, timing.warmUpAttempts);
        },
        listProducts: () => listAll(PRODUCTS_PATH, parseProduct),
        listCategories: () => listAll(CATEGORIES_PATH, parseCategory),
        async createCategory(input) {
            const reply = await write("POST", CATEGORIES_PATH, JSON.stringify({ name: input.name, parentId: input.parentId }));
            return readCreated(reply, `category "${input.name}"`, parseCategory);
        },
        async createProduct(input) {
            const form = new FormData();
            form.append("Name", input.name);
            if (input.description) form.append("Description", input.description);
            form.append("CategoryId", String(input.categoryId));
            input.variants.forEach((variant, i) => {
                form.append(`Variants[${i}].CapacityMl`, String(variant.capacityMl));
                form.append(`Variants[${i}].DiameterMm`, String(variant.diameterMm));
                variant.priceTiers.forEach((tier, j) => {
                    form.append(`Variants[${i}].PriceTiers[${j}].MinQuantity`, String(tier.minQuantity));
                    form.append(`Variants[${i}].PriceTiers[${j}].UnitPrice`, String(tier.unitPrice));
                });
            });
            form.append("AvatarImage", new File([input.avatar.bytes], input.avatar.fileName, { type: "image/jpeg" }));
            return readCreated(await write("POST", PRODUCTS_PATH, form), `product "${input.name}"`, parseProduct);
        },
        async deleteProduct(id) {
            await write("DELETE", `${PRODUCTS_PATH}/${id}`);
        },
        async deleteCategory(id) {
            await write("DELETE", `${CATEGORIES_PATH}/${id}`);
        },
    };
}
