import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Snapshot, StoreItem } from "./fetch.ts";

// Turns the old WooCommerce snapshot into flat "price rows": one per simple product or per
// variation, with everything the pivot in families.ts needs. The snapshot comes from a site
// that is probably compromised, so it is treated as untrusted data: text is reduced to plain
// text, scanned, and anything that cannot be read with certainty goes to `needsReview`
// instead of being guessed.

export type Kind = "cup" | "lid" | "paper" | "bowl" | "bowlLid" | "accessory";
export type Material = "PP" | "PET" | "giấy" | "kraft";
export type Brand = "UKP" | "MVP" | "HT";
export type PrintType = { colors: "1" | "multi"; pe: 1 | 2 | null; gsm: number | null; coatGsm: number | null };

export type PriceRow = {
    productId: number;
    variationId: number | null;
    slug: string;
    name: string;
    kind: Kind;
    material: Material | null;
    /** Cups: the shape words of the old name ("Bầu", "Tim"). Lids: the lower-case shape phrase ("cầu có che"). */
    shape: string | null;
    color: "đen" | null;
    /** 0 for lids, bowl lids and accessories. */
    capacityMl: number;
    /** Kept as text ("16oz", "12/14oz"), never converted to ml. */
    oz: string | null;
    /** Null only for accessories. */
    diameterMm: number | null;
    heightMm: number | null;
    baseDiameterMm: number | null;
    brand: Brand | null;
    grade: string | null;
    printType: PrintType | null;
    /** The "Ghi chú sản phẩm" lines of paper cups and bowls. */
    notes: string[];
    /** Whole VND, from `prices.price` (the effective price including any sale). */
    unitPrice: number;
    flags: string[];
};

export type ReviewItem = { productId: number; variationId: number | null; name: string; reasons: string[] };
export type DroppedRow = { productId: number; variationId: number | null; name: string; price: string };
export type ParsedCatalog = { rows: PriceRow[]; needsReview: ReviewItem[]; dropped: DroppedRow[] };

/** Owner-curated fill-ins, keyed by old product id. They only fill what the parser left empty. */
export type Overrides = { products: Record<string, { material?: "PP" | "PET"; brand?: Brand }> };

const OVERRIDES_PATH = join(import.meta.dirname, "overrides.json");

const BRANDS: readonly Brand[] = ["UKP", "MVP", "HT"];
const SUSPICIOUS = /<script|<iframe|javascript:|\bon[a-z]+\s*=|https?:\/\/|casino|1win|mostbet|jackpot/i;
const SUSPICIOUS_REASON = "Nội dung đáng ngờ (script, liên kết hoặc từ khóa spam)";
const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    hellip: "…",
};

const CAPACITY = /(\d{3,4})(?:\s*\/\s*(\d{3,4}))?\s*ml\b/iu;
const LABEL_CAPACITY = /(\d{3,4})(?:\s*\/\s*(\d{3,4}))?/u;
const LABEL_LINE = /^(Kích thước|Dung tích \(ml\)|Kiểu|Loại)\s*:?\s*(.*)$/iu;
const BRAND_CLAUSE = /(?:H[ãa]ng|Loại)\s+((?:UKP|MVP|HT)(?![\p{L}\d]).*)$/iu;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOverrides(value: unknown): value is Overrides {
    if (!isRecord(value) || !isRecord(value.products)) return false;
    return Object.entries(value.products).every(
        ([id, entry]) =>
            /^\d+$/.test(id) &&
            isRecord(entry) &&
            Object.entries(entry).every(([field, fill]) =>
                field === "material" ? fill === "PP" || fill === "PET" : field === "brand" && BRANDS.some((brand) => brand === fill),
            ),
    );
}

export async function loadOverrides(path = OVERRIDES_PATH): Promise<Overrides> {
    const data: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!isOverrides(data)) {
        throw new Error(
            `${path}: expected {"products": {"<oldProductId>": {"material"?: "PP"|"PET", "brand"?: "UKP"|"MVP"|"HT"}}}`,
        );
    }
    return data;
}

// ---- Text helpers --------------------------------------------------------------------------

export function decodeEntities(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
        if (body.startsWith("#")) {
            const code = body[1].toLowerCase() === "x" ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
            return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
        }
        return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    });
}

/** Plain text of a name or label: entities decoded, NFC, whitespace collapsed. */
export function clean(text: string): string {
    return decodeEntities(text).normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Plain text of a description: one line per paragraph, list item, table row or `<br>`; table cells join with a space. */
export function htmlToText(html: string): string {
    const stripped = html
        .replace(/<\/t[dh]>\s*<t[dh]\b[^>]*>/gi, " ")
        .replace(/<br\s*\/?>|<\/(?:p|li|tr|h[1-6]|div|ul|table)>/gi, "\n")
        .replace(/<[^>]*>/g, "");
    return decodeEntities(stripped)
        .normalize("NFC")
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
}

/** For plain text (entities already decoded): the spam scan, or an angle bracket left over from an entity-encoded tag. */
function isSuspicious(plain: string): boolean {
    return SUSPICIOUS.test(plain) || /[<>]/.test(plain);
}

function readLabels(lines: string[]): Map<string, string> {
    const labels = new Map<string, string>();
    for (const line of lines) {
        const match = LABEL_LINE.exec(line);
        const label = match?.[1].toLowerCase();
        if (match && label && !labels.has(label)) labels.set(label, match[2].trim());
    }
    return labels;
}

function toNumber(match: RegExpExecArray | null): number | null {
    return match ? Number.parseFloat(match[1].replace(",", ".")) : null;
}

function toBrand(text: string): Brand | null {
    return BRANDS.find((brand) => brand === text.toUpperCase()) ?? null;
}

function normalizeGrade(text: string): string | null {
    const grade = text.replace(/\s+/g, " ").trim().replace(/Loại/giu, "loại");
    return grade ? grade[0].toUpperCase() + grade.slice(1) : null;
}

/** "UKP Dày Loại 1" -> UKP + "Dày loại 1"; "Loại thường" -> no brand + "Loại thường". */
function parseBrand(text: string): { brand: Brand | null; grade: string | null } {
    const match = /^(UKP|MVP|HT)(?![\p{L}\d])\s*(.*)$/iu.exec(text);
    return match ? { brand: toBrand(match[1]), grade: normalizeGrade(match[2]) } : { brand: null, grade: normalizeGrade(text) };
}

/** "In 1 màu 2PE 260 gsm", "In Nhiều Màu", "In 1 màu 300gsm + 15gsm PE". */
export function parsePrintType(term: string): PrintType | null {
    const multi = /nhiều\s+màu/iu.test(term);
    if (!multi && !/(?<!\d)1\s+màu/iu.test(term)) return null;
    const pe = /(?<!\d)([12])\s*PE\b/i.exec(term);
    return {
        colors: multi ? "multi" : "1",
        pe: pe ? (pe[1] === "1" ? 1 : 2) : null,
        gsm: toNumber(/(\d+)\s*gsm/i.exec(term)),
        coatGsm: toNumber(/\+\s*(\d+)\s*gsm\s*PE/i.exec(term)),
    };
}

/** Splits a variation label such as "Hãng: UKP Dày loại 1". */
function splitTerm(label: string): { attribute: string; value: string } | null {
    const match = /^([^:]+?)\s*:\s*(.+)$/.exec(label);
    return match ? { attribute: match[1].toLowerCase(), value: match[2] } : null;
}

// ---- Raw snapshot items --------------------------------------------------------------------

type Raw = {
    id: number;
    type: string;
    name: string;
    slug: string;
    shortHtml: string;
    longHtml: string;
    price: string;
    categorySlug: string | null;
    label: string;
};

function text(item: StoreItem, key: string): string {
    const value = item[key];
    if (typeof value !== "string") throw new Error(`snapshot item ${item.id}: "${key}" is not a string`);
    return value;
}

function slugOf(permalink: string): string {
    try {
        return new URL(permalink).pathname.split("/").filter(Boolean).pop() ?? "";
    } catch {
        return "";
    }
}

function readItem(item: StoreItem): Raw {
    if (item.prices.currency_minor_unit !== 0) {
        throw new Error(
            `snapshot item ${item.id}: currency_minor_unit is ${item.prices.currency_minor_unit}, the import assumes whole VND (0)`,
        );
    }
    const prices: JsonRecord = item.prices;
    const [category] = Array.isArray(item.categories) ? (item.categories as unknown[]) : [];
    return {
        id: item.id,
        type: text(item, "type"),
        name: clean(text(item, "name")),
        slug: slugOf(text(item, "permalink")),
        shortHtml: text(item, "short_description"),
        longHtml: text(item, "description"),
        price: String(prices.price ?? "").trim(),
        categorySlug: isRecord(category) && typeof category.slug === "string" ? category.slug : null,
        label: typeof item.variation === "string" ? clean(item.variation) : "",
    };
}

// ---- Product-level spec --------------------------------------------------------------------

type Spec = {
    /** The fields every row of this product shares. */
    base: Omit<PriceRow, "variationId" | "capacityMl" | "brand" | "grade" | "printType" | "unitPrice" | "flags">;
    capacities: number[] | null;
    /** Text after "Hãng"/"Loại" in the name, e.g. "UKP Dày Loại 1". */
    clause: string | null;
    problems: string[];
};

function kindOf(slug: string | null, name: string): Kind | null {
    switch (slug) {
        case "in-ly-nhua":
            return "cup";
        case "in-ly-giay-to-giay":
            return /tô\s+giấy/iu.test(name) ? "bowl" : "paper";
        case "nap-ly":
            return "lid";
        case "nap-to-giay":
            return "bowlLid";
        case "phu-kien-ly":
            return "accessory";
        default:
            return null;
    }
}

function materialOf(kind: Kind, name: string, loai: string): Material | null {
    if (kind === "paper" || kind === "bowl") return /kraft/iu.test(`${name} ${loai}`) ? "kraft" : "giấy";
    if (kind !== "cup" && kind !== "bowlLid") return null;
    for (const source of [name, loai]) {
        const found = new Set((source.match(/\b(?:PET|PP)\b/gi) ?? []).map((token) => token.toUpperCase()));
        if (found.size === 1) return found.has("PP") ? "PP" : "PET";
    }
    return null;
}

/** The words between "In Ly" and the capacity, minus material, colour and oz: "Bầu", "Tim", "Nắp Tim Đài Loan". */
function cupShape(name: string): { shape: string | null; color: "đen" | null } {
    const lead = name.replace(/^in\s+ly\s+/iu, "").split(CAPACITY)[0].split(/\s+/).filter(Boolean);
    const shape = lead.filter((word) => !/^(?:pp|pet|đen)$/iu.test(word) && !/^\d+(?:\/\d+)?oz$/iu.test(word)).join(" ");
    return { shape: shape || null, color: lead.some((word) => /^đen$/iu.test(word)) ? "đen" : null };
}

/** The old name without "Nắp", the diameter, the brand clause and "cho ly/tô giấy": "cầu đen". */
function lidShape(name: string): { shape: string; color: "đen" | null } {
    const shape = name
        .replace(/^n[ắăa]p\s+/iu, "")
        .replace(/ph[iì]\s*\d+/giu, "")
        .replace(/cho\s+(?:ly|tô)\s+giấy/giu, "")
        .replace(BRAND_CLAUSE, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    return { shape, color: /(?:^|\s)đen(?:\s|$)/u.test(shape) ? "đen" : null };
}

function ozOf(name: string): string | null {
    const match = /(\d+(?:\s*\/\s*\d+)?)\s*oz\b/iu.exec(name);
    return match ? `${match[1].replace(/\s+/g, "")}oz` : null;
}

function capacitiesOf(match: RegExpExecArray | null): number[] | null {
    return match ? [match[1], match[2]].filter(Boolean).map(Number) : null;
}

function parseSpec(raw: Raw): Spec {
    const kind = kindOf(raw.categorySlug, raw.name);
    const problems: string[] = [];
    const lines = `${htmlToText(raw.shortHtml)}\n${htmlToText(raw.longHtml)}`.split("\n");
    const labels = readLabels(lines);
    const size = labels.get("kích thước") ?? "";
    const noteStart = lines.findIndex((line) => /^Ghi chú sản phẩm/iu.test(line));
    if (!kind) problems.push(`Danh mục cũ "${raw.categorySlug ?? "?"}" không nhận diện được`);

    const fromName = capacitiesOf(CAPACITY.exec(raw.name));
    const fromLabel = capacitiesOf(LABEL_CAPACITY.exec(labels.get("dung tích (ml)") ?? ""));
    if (fromName && fromLabel && fromName.join("/") !== fromLabel.join("/")) {
        problems.push(`Dung tích trong tên (${fromName.join("/")}) khác mô tả (${fromLabel.join("/")})`);
    }
    const usesCapacity = kind === "cup" || kind === "paper" || kind === "bowl";
    const capacities = usesCapacity ? (fromName ?? fromLabel) : [0];
    if (usesCapacity && !capacities) problems.push("Không đọc được dung tích");

    const nameDiameter = toNumber(/ph[iì]\s*(\d{2,3})(?!\d)/iu.exec(raw.name));
    const labelDiameter = toNumber(/^ph[iì]\s*(\d+(?:[.,]\d+)?)/iu.exec(size));
    if (nameDiameter && labelDiameter && nameDiameter !== labelDiameter) {
        problems.push(`Đường kính trong tên (${nameDiameter}) khác mô tả (${labelDiameter})`);
    }
    const diameter = nameDiameter ?? labelDiameter;
    const validDiameter = diameter !== null && Number.isInteger(diameter);
    if (kind && kind !== "accessory" && !validDiameter) problems.push("Không đọc được đường kính");

    const material = kind ? materialOf(kind, raw.name, labels.get("loại") ?? "") : null;
    if (kind === "bowlLid" && !material) problems.push("Không rõ chất liệu nắp tô giấy (PP/PET)");

    return {
        base: {
            productId: raw.id,
            slug: raw.slug,
            name: raw.name,
            kind: kind ?? "accessory",
            material,
            ...(kind === "cup" ? cupShape(raw.name) : kind === "lid" ? lidShape(raw.name) : { shape: null, color: null }),
            oz: ozOf(raw.name),
            diameterMm: validDiameter ? diameter : null,
            heightMm: toNumber(/cao\s*(\d+(?:[.,]\d+)?)\s*mm/iu.exec(size)),
            baseDiameterMm: toNumber(/đáy\s*ph[iì]\s*(\d+(?:[.,]\d+)?)/iu.exec(size)),
            notes: (kind === "paper" || kind === "bowl") && noteStart >= 0 ? lines.slice(noteStart + 1) : [],
        },
        capacities,
        clause: kind === "cup" || kind === "lid" ? (BRAND_CLAUSE.exec(raw.name)?.[1] ?? null) : null,
        problems,
    };
}

// ---- Rows ----------------------------------------------------------------------------------

type Term = { brand: Brand | null; grade: string | null; printType: PrintType | null };

/** Reads the variation attribute (or, for a simple product, the brand clause of its name). */
function readTerm(spec: Spec, raw: Raw, isVariation: boolean): Term | string {
    const empty: Term = { brand: null, grade: null, printType: null };
    const term = splitTerm(raw.label);
    const { kind } = spec.base;
    if (kind === "cup" || kind === "lid") {
        if (!isVariation) return spec.clause ? { ...empty, ...parseBrand(spec.clause) } : empty;
        if (term?.attribute !== "hãng") return `Thuộc tính biến thể lạ: "${raw.label}"`;
        return { ...empty, ...parseBrand(term.value) };
    }
    if (kind === "paper" || kind === "bowl") {
        const printType = term?.attribute === "kiểu in" ? parsePrintType(term.value) : null;
        return printType ? { ...empty, printType } : `Không đọc được kiểu in: "${raw.label}"`;
    }
    return empty;
}

export function parseCatalog(snapshot: Snapshot, overrides: Overrides): ParsedCatalog {
    const known = new Set(snapshot.products.map((product) => product.id));
    for (const id of Object.keys(overrides.products)) {
        if (!known.has(Number(id))) throw new Error(`overrides.json: product ${id} is not in the snapshot`);
    }
    const variationsByParent = new Map<number, StoreItem[]>();
    for (const variation of snapshot.variations) {
        const parent = typeof variation.parent === "number" ? variation.parent : 0;
        variationsByParent.set(parent, [...(variationsByParent.get(parent) ?? []), variation]);
    }

    const result: ParsedCatalog = { rows: [], needsReview: [], dropped: [] };
    for (const product of snapshot.products) {
        const raw = readItem(product);
        const spec = parseSpec(raw);
        // The raw HTML still has its tags; the decoded text catches entity-encoded payloads.
        const decoded = `${raw.name}\n${htmlToText(raw.shortHtml)}\n${htmlToText(raw.longHtml)}`;
        if (SUSPICIOUS.test(`${raw.name} ${raw.shortHtml} ${raw.longHtml}`) || isSuspicious(decoded)) {
            spec.problems.push(SUSPICIOUS_REASON);
        }
        const review = (variationId: number | null, reasons: string[]) =>
            result.needsReview.push({ productId: raw.id, variationId, name: raw.name, reasons });
        const entries = raw.type === "simple" ? [null] : raw.type === "variable" ? (variationsByParent.get(raw.id) ?? []) : [];
        if (entries.length === 0) review(null, [`Không có biến thể nào để nhập (loại "${raw.type}")`]);

        for (const entry of entries) {
            const source = entry ? readItem(entry) : raw;
            const variationId = entry ? source.id : null;
            // A variation label ends up in a family name, so it gets the same scan as the product text.
            if (entry && isSuspicious(`${source.name} ${source.label}`)) {
                review(variationId, [...new Set([...spec.problems, SUSPICIOUS_REASON])]);
                continue;
            }
            if (!/^[1-9]\d*$/.test(source.price)) {
                result.dropped.push({ productId: raw.id, variationId, name: raw.name, price: source.price });
                continue;
            }
            const term = readTerm(spec, source, entry !== null);
            const problems = typeof term === "string" ? [...spec.problems, term] : spec.problems;
            if (typeof term === "string" || problems.length > 0) {
                review(variationId, problems);
                continue;
            }
            const fill = overrides.products[String(raw.id)] ?? {};
            for (const capacityMl of spec.capacities ?? []) {
                result.rows.push({
                    ...spec.base,
                    material: spec.base.material ?? fill.material ?? null,
                    variationId,
                    capacityMl,
                    brand: term.brand ?? fill.brand ?? null,
                    grade: term.grade,
                    printType: term.printType,
                    unitPrice: Number(source.price),
                    flags: (spec.capacities?.length ?? 0) > 1 ? ["multi-capacity"] : [],
                });
            }
        }
    }
    return result;
}
