import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { buildFamilies, type CategoryTarget, type Family, type Variant } from "./families.ts";
import { imagePath, loadSnapshot, type Snapshot } from "./fetch.ts";
import { loadOverrides, parseCatalog, type DroppedRow, type Kind, type ParsedCatalog, type ReviewItem } from "./parse.ts";
import { renderPlanReport } from "./report.ts";

// `plan` is the dry-run: it parses the committed snapshot, pivots it into families, compares them
// with what production already holds and writes out/plan.json + out/plan.md. It only ever issues
// GET requests, sends no credentials and writes nothing but the two files in out/.

export const OUT_DIR = join(import.meta.dirname, "out");
export const PLAN_PATH = join(OUT_DIR, "plan.json");
export const PLAN_REPORT_PATH = join(OUT_DIR, "plan.md");

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const WARM_UP_ATTEMPTS = 5;
const WARM_UP_TIMEOUT_MS = 60_000;
const READ_ATTEMPTS = 3;
const READ_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

const USAGE = `Usage: IMPORT_TARGET_URL=<backend origin> node scripts/import-old-site/cli.ts plan

Dry-run. Reads data/snapshot.json and overrides.json, GETs the products and categories of the
target backend and writes out/plan.json and out/plan.md. Nothing is written to any backend.

IMPORT_TARGET_URL is required and has no default, e.g. https://backend-api-dotnet9.onrender.com

Options:
  -h, --help  show this help`;

export type Action = "create" | "skip-overlap" | "needs-decision" | "deferred";

export type ProdVariant = {
    capacityMl: number;
    diameterMm: number;
    priceTiers: Array<{ minQuantity: number; unitPrice: number }>;
};
export type ProdProduct = { id: number; name: string; categoryId: number; variants: ProdVariant[] };
export type ProdCategory = { id: number; name: string; parentId: number | null };
export type Production = { products: ProdProduct[]; categories: ProdCategory[] };

export type PlanCategory = { id: number | null; name: string; parentId: number; isNew: boolean };
/** A production variant with the same category, capacity and diameter. `delta` = old price - production price. */
export type Overlap = { productId: number; productName: string; minQuantity: number; unitPrice: number; delta: number };
export type PlanVariant = Variant & { overlaps: Overlap[] };

export type PlanFamily = Omit<Family, "blockers" | "category" | "variants"> & {
    action: Action;
    reasons: string[];
    category: PlanCategory | null;
    variants: PlanVariant[];
    sameNameProductIds: number[];
};

export type PlanBody = {
    schema: 1;
    target: { origin: string; host: string; productCount: number; categoryCount: number; maxProductId: number };
    snapshot: { fetchedAt: string; source: string; products: number; variations: number };
    totals: Record<Action, { families: number; variants: number }>;
    categoriesToCreate: Array<{ name: string; parentId: number }>;
    /** In import order. */
    families: PlanFamily[];
    needsReview: ReviewItem[];
    dropped: DroppedRow[];
};

/** `planSha256` is the SHA-256 of the canonical JSON of the body, so it ignores `generatedAt`. */
export type Plan = PlanBody & { planSha256: string; generatedAt: string };

// ---- Target and production (GET only) ------------------------------------------------------

/** IMPORT_TARGET_URL must be set explicitly (the app's own default is production, which scripts must not inherit). */
export function parseTargetUrl(raw: string | undefined): URL {
    if (!raw?.trim()) {
        throw new Error(
            "IMPORT_TARGET_URL is required and has no default: set it to the backend origin, " +
                "e.g. IMPORT_TARGET_URL=https://backend-api-dotnet9.onrender.com",
        );
    }
    let url: URL;
    try {
        url = new URL(raw.trim());
    } catch {
        throw new Error(`IMPORT_TARGET_URL is not a valid URL: ${raw}`);
    }
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
        throw new Error(`IMPORT_TARGET_URL must use https (http is only accepted for localhost): ${url.origin}`);
    }
    if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
        throw new Error(`IMPORT_TARGET_URL must be a bare origin such as ${url.origin}, without path, query or credentials`);
    }
    return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProdVariant(value: unknown): value is ProdVariant {
    return (
        isRecord(value) &&
        typeof value.capacityMl === "number" &&
        typeof value.diameterMm === "number" &&
        Array.isArray(value.priceTiers) &&
        value.priceTiers.length > 0 &&
        value.priceTiers.every(
            (tier) => isRecord(tier) && typeof tier.minQuantity === "number" && typeof tier.unitPrice === "number",
        )
    );
}

function isProdProduct(value: unknown): value is ProdProduct {
    return (
        isRecord(value) &&
        typeof value.id === "number" &&
        typeof value.name === "string" &&
        typeof value.categoryId === "number" &&
        Array.isArray(value.variants) &&
        value.variants.every(isProdVariant)
    );
}

function isProdCategory(value: unknown): value is ProdCategory {
    return (
        isRecord(value) &&
        typeof value.id === "number" &&
        typeof value.name === "string" &&
        (value.parentId === null || typeof value.parentId === "number")
    );
}

function describeError(error: unknown): string {
    if (!(error instanceof Error)) return String(error);
    const cause = error.cause instanceof Error ? ` (${(error.cause as NodeJS.ErrnoException).code ?? error.cause.message})` : "";
    return `${error.message}${cause}`;
}

/** GET with a timeout; retries timeouts, network errors and 5xx (Render free tier cold-starts in 30-60 s), never 4xx. */
async function get(url: URL, timeoutMs: number, attempts: number): Promise<Response> {
    let failure = "";
    for (let attempt = 1; attempt <= attempts; attempt++) {
        if (attempt > 1) await sleep(RETRY_DELAY_MS * (attempt - 1));
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { accept: "application/json" },
                redirect: "error",
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (response.ok) return response;
            failure = `HTTP ${response.status}`;
            if (response.status < 500) break;
        } catch (error) {
            failure = describeError(error);
        }
    }
    throw new Error(`GET ${url.href} failed: ${failure}`);
}

async function listAll<T>(origin: string, path: string, isItem: (value: unknown) => value is T): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = new URL(`${path}?page=${page}&pageSize=${PAGE_SIZE}`, origin);
        const data: unknown = await (await get(url, READ_TIMEOUT_MS, READ_ATTEMPTS)).json();
        const payload = isRecord(data) ? data.items : data;
        const batch: unknown[] | null = Array.isArray(payload) ? payload : null;
        if (!batch || !batch.every(isItem)) throw new Error(`GET ${url.href}: unexpected response shape`);
        items.push(...batch);
        // A bare array is the whole collection; a paged object says how many items exist in total.
        const total = isRecord(data) ? data.totalCount : undefined;
        const lastPage = typeof total === "number" ? items.length >= total : batch.length < PAGE_SIZE;
        if (!isRecord(data) || batch.length === 0 || lastPage) return items;
    }
    throw new Error(`${path}: more than ${MAX_PAGES} pages`);
}

export async function fetchProduction(origin: string): Promise<Production> {
    await get(new URL("/health", origin), WARM_UP_TIMEOUT_MS, WARM_UP_ATTEMPTS);
    return {
        products: await listAll(origin, "/api/v1/Products", isProdProduct),
        categories: await listAll(origin, "/api/v1/Categories", isProdCategory),
    };
}

// ---- Plan ----------------------------------------------------------------------------------

function fold(text: string): string {
    return text
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

type Resolved = { category: PlanCategory | null; problem: string | null };

function resolveCategory(target: CategoryTarget | null, categories: ProdCategory[]): Resolved {
    if (!target) return { category: null, problem: null };
    const sameName = (category: ProdCategory) => fold(category.name) === fold(target.name);
    if (target.id !== null) {
        const found = categories.find((category) => category.id === target.id);
        if (!found || found.parentId !== target.parentId || !sameName(found)) {
            const problem = `Danh mục #${target.id} "${target.name}" không còn khớp trên production; kiểm tra lại ánh xạ danh mục`;
            return { category: null, problem };
        }
        return { category: { ...target, isNew: false }, problem: null };
    }
    if (!categories.some((category) => category.id === target.parentId)) {
        const problem = `Danh mục cha #${target.parentId} không có trên production nên không tạo được "${target.name}"`;
        return { category: null, problem };
    }
    const existing = categories.find((category) => category.parentId === target.parentId && sameName(category));
    const category = { id: existing?.id ?? null, name: target.name, parentId: target.parentId, isNew: !existing };
    return { category, problem: null };
}

function overlapKey(categoryId: number, capacityMl: number, diameterMm: number): string {
    return `${categoryId}|${capacityMl}|${diameterMm}`;
}

type ProdIndex = Map<string, Array<{ product: ProdProduct; variant: ProdVariant }>>;

function indexProduction(products: ProdProduct[]): ProdIndex {
    const index: ProdIndex = new Map();
    for (const product of products) {
        for (const variant of product.variants) {
            const key = overlapKey(product.categoryId, variant.capacityMl, variant.diameterMm);
            index.set(key, [...(index.get(key) ?? []), { product, variant }]);
        }
    }
    return index;
}

function planFamily(family: Family, production: Production, index: ProdIndex, hasImage: (id: number) => boolean): PlanFamily {
    const { blockers, category: target, variants, ...rest } = family;
    const reasons = [...blockers];
    const warnings = [...family.warnings];
    const resolved = resolveCategory(target, production.categories);
    if (resolved.problem) reasons.push(resolved.problem);

    const categoryId = resolved.category?.id ?? null;
    const planVariants: PlanVariant[] = variants.map((variant) => {
        const key = categoryId === null ? null : overlapKey(categoryId, variant.capacityMl, variant.diameterMm);
        const matches = key === null ? [] : (index.get(key) ?? []);
        const overlaps = matches.map(({ product, variant: existing }): Overlap => {
            const tier = [...existing.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity)[0];
            return {
                productId: product.id,
                productName: product.name,
                minQuantity: tier.minQuantity,
                unitPrice: tier.unitPrice,
                delta: variant.priceTiers[0].unitPrice - tier.unitPrice,
            };
        });
        return { ...variant, overlaps };
    });
    const overlapping = planVariants.filter((variant) => variant.overlaps.length > 0);
    const overlapIds = [...new Set(overlapping.flatMap((variant) => variant.overlaps.map((overlap) => overlap.productId)))];
    const sameNameProductIds = production.products
        .filter((product) => categoryId !== null && product.categoryId === categoryId && fold(product.name) === fold(family.name))
        .map((product) => product.id);
    const listIds = (list: number[]) => list.sort((a, b) => a - b).map((id) => `#${id}`).join(", ");

    if (family.avatarOldProductId !== null && !hasImage(family.avatarOldProductId)) {
        warnings.push(`Chưa có ảnh data/images/${family.avatarOldProductId}.jpg; chạy "fetch --images-only" trước khi apply`);
    }

    let action: Action;
    if (family.kind === "accessory") {
        action = "deferred";
        reasons.push("Backend chưa có đơn vị tính (kg / cái / cuộn); nhập vào mục nắp sẽ hiển thị sai");
    } else if (reasons.length > 0) {
        action = "needs-decision";
    } else if (overlapping.length > 0) {
        action = "skip-overlap";
        const overlap = `${overlapping.length}/${planVariants.length} biến thể với sản phẩm đang có ${listIds(overlapIds)}`;
        reasons.push(`Trùng ${overlap}; mặc định bỏ qua, không ghi đè`);
    } else if (sameNameProductIds.length > 0) {
        action = "needs-decision";
        reasons.push(`Đã có sản phẩm cùng tên trong danh mục này (${listIds(sameNameProductIds)}) dù không trùng biến thể`);
    } else {
        action = "create";
    }

    return { ...rest, warnings, action, reasons, category: resolved.category, variants: planVariants, sameNameProductIds };
}

export function buildPlan(input: {
    snapshot: Snapshot;
    parsed: ParsedCatalog;
    families: Family[];
    production: Production;
    origin: URL;
    hasImage: (productId: number) => boolean;
}): PlanBody {
    const { snapshot, parsed, production, origin } = input;
    const index = indexProduction(production.products);
    const families = input.families.map((family) => planFamily(family, production, index, input.hasImage));

    const totals: PlanBody["totals"] = {
        create: { families: 0, variants: 0 },
        "skip-overlap": { families: 0, variants: 0 },
        "needs-decision": { families: 0, variants: 0 },
        deferred: { families: 0, variants: 0 },
    };
    for (const family of families) {
        totals[family.action].families++;
        totals[family.action].variants += family.variants.length;
    }
    const categoriesToCreate: PlanBody["categoriesToCreate"] = [];
    for (const { action, category } of families) {
        if (action !== "create" || !category?.isNew) continue;
        if (!categoriesToCreate.some((other) => other.name === category.name && other.parentId === category.parentId)) {
            categoriesToCreate.push({ name: category.name, parentId: category.parentId });
        }
    }

    return {
        schema: 1,
        target: {
            origin: origin.origin,
            host: origin.host,
            productCount: production.products.length,
            categoryCount: production.categories.length,
            maxProductId: Math.max(0, ...production.products.map((product) => product.id)),
        },
        snapshot: {
            fetchedAt: snapshot.fetchedAt,
            source: snapshot.source,
            products: snapshot.products.length,
            variations: snapshot.variations.length,
        },
        totals,
        categoriesToCreate,
        families,
        needsReview: parsed.needsReview,
        dropped: parsed.dropped,
    };
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

export function hashPlanBody(body: PlanBody): string {
    return createHash("sha256").update(JSON.stringify(sortKeys(body))).digest("hex");
}

export function finalizePlan(body: PlanBody, generatedAt = new Date().toISOString()): Plan {
    return { planSha256: hashPlanBody(body), generatedAt, ...body };
}

/** The hashed part of a plan.json that was read back from disk. */
export function planBody(plan: Plan): PlanBody {
    const body: Partial<Plan> = { ...plan };
    delete body.planSha256;
    delete body.generatedAt;
    return body as PlanBody;
}

// ---- Command -------------------------------------------------------------------------------

const KIND_LABEL: Record<Kind, string> = {
    cup: "ly nhựa",
    paper: "ly giấy",
    bowl: "tô giấy",
    lid: "nắp",
    bowlLid: "nắp tô giấy",
    accessory: "phụ kiện",
};

function summarize(plan: Plan): string {
    const kinds = new Map<Kind, number>();
    for (const family of plan.families) kinds.set(family.kind, (kinds.get(family.kind) ?? 0) + 1);
    const lines = Object.entries(plan.totals).map(
        ([action, { families, variants }]) =>
            `  ${action.padEnd(14)} ${String(families).padStart(3)} families, ${String(variants).padStart(3)} variants`,
    );
    const { target } = plan;
    return [
        `Target ${target.host}: ${target.productCount} products, ${target.categoryCount} categories (max product id ${target.maxProductId})`,
        `Snapshot: ${plan.snapshot.products} products, ${plan.snapshot.variations} variations`,
        `Families: ${plan.families.length} (${[...kinds].map(([kind, count]) => `${count} ${KIND_LABEL[kind]}`).join(", ")})`,
        ...lines,
        `New categories: ${plan.categoriesToCreate.map((c) => `"${c.name}" under #${c.parentId}`).join(", ") || "none"}`,
        `Needs review: ${plan.needsReview.length}, dropped rows: ${plan.dropped.length}`,
        `planSha256: ${plan.planSha256}`,
    ].join("\n");
}

export async function runPlan(args: string[]) {
    const { values } = parseArgs({ args, options: { help: { type: "boolean", short: "h" } }, allowPositionals: false });
    if (values.help) {
        console.log(USAGE);
        return;
    }
    const origin = parseTargetUrl(process.env.IMPORT_TARGET_URL);

    const snapshot = await loadSnapshot();
    const parsed = parseCatalog(snapshot, await loadOverrides());
    const families = buildFamilies(parsed.rows);
    console.log(`Reading ${origin.origin} (GET only; the first request may take a minute while the host wakes up)`);
    const production = await fetchProduction(origin.origin);

    const hasImage = (productId: number) => existsSync(imagePath(productId));
    const plan = finalizePlan(buildPlan({ snapshot, parsed, families, production, origin, hasImage }));
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
    await writeFile(PLAN_REPORT_PATH, renderPlanReport(plan));
    console.log(`${summarize(plan)}\nWrote ${PLAN_PATH}\nWrote ${PLAN_REPORT_PATH}`);
}
