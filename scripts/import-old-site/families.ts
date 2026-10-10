import type { Kind, PriceRow } from "./parse.ts";

// The old site models "size = product, brand/grade = variation"; the new backend models
// "type = product, size (capacity x diameter) = variant". buildFamilies() pivots the flat
// price rows from parse.ts: the type (material, shape, brand, grade, print) becomes the family
// and capacity x diameter becomes the variant, with the old price as its single tier.

export type Source = { productId: number; variationId: number | null; slug: string };

export type Variant = {
    capacityMl: number;
    diameterMm: number;
    /** One tier at quantity 1 = the old price. The old site has no quantity tiers. */
    priceTiers: Array<{ minQuantity: number; unitPrice: number }>;
    heightMm: number | null;
    baseDiameterMm: number | null;
    oz: string | null;
    flags: string[];
    source: Source;
};

/** `id: null` means "create it as a child of `parentId`". Ids and names are the production facts from plan.md. */
export type CategoryTarget = { id: number | null; name: string; parentId: number };

export type Phase = "A" | "B" | "C";

export type Family = {
    key: string;
    name: string;
    kind: Kind;
    phase: Phase;
    category: CategoryTarget | null;
    description: string;
    variants: Variant[];
    /** Old price rows folded into this family (accessories keep no variants but still count their rows). */
    rowCount: number;
    oldProducts: Array<{ productId: number; slug: string }>;
    /** Old product whose image becomes the avatar: the median-capacity member. Null for deferred accessories. */
    avatarOldProductId: number | null;
    warnings: string[];
    /** Why the target category (or the identity) cannot be decided from the data; plan.ts turns this into `needs-decision`. */
    blockers: string[];
};

const CATEGORY = {
    pet: { id: 29, name: "Ly Pet", parentId: 24 },
    pp: { id: 30, name: "Ly PP", parentId: 24 },
    lidUkp: { id: 21, name: "Nắp UKP", parentId: 20 },
    lidMvp: { id: 22, name: "Nắp MVP-VP", parentId: 20 },
    paper1: { id: 31, name: "Ly giấy 1 lớp", parentId: 23 },
    paper2: { id: 32, name: "Ly giấy 2 lớp", parentId: 23 },
    paperColor: { id: 33, name: "Ly in offset", parentId: 23 },
    bowl: { id: null, name: "Tô giấy", parentId: 23 },
    bowlLid: { id: null, name: "Nắp tô giấy", parentId: 20 },
} as const satisfies Record<string, CategoryTarget>;

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
// Import order (the home page shows the newest cups): paper first, lids before plastic cups, deferred last.
const KIND_RANK: Record<Kind, number> = { paper: 0, bowl: 1, bowlLid: 2, lid: 3, cup: 4, accessory: 5 };
const KIND_PHASE: Record<Kind, Phase> = { paper: "A", bowl: "A", bowlLid: "A", lid: "B", cup: "B", accessory: "C" };

function lowerFirst(text: string): string {
    return text[0].toLowerCase() + text.slice(1);
}

function printSpec(row: PriceRow): string {
    const { printType } = row;
    if (!printType) return "";
    const coat = printType.coatGsm ? `+ ${printType.coatGsm}gsm PE` : "";
    return [printType.pe && `${printType.pe}PE`, printType.gsm && `${printType.gsm}gsm`, coat].filter(Boolean).join(" ");
}

/** Generated family name: `Ly PP Bầu MVP Dày loại 1`, `Nắp cầu`, `Ly giấy 2PE 260gsm – In 1 màu`. */
function familyName(row: PriceRow): string {
    switch (row.kind) {
        case "cup":
            return ["Ly", row.material, row.shape, row.color && "Đen", row.brand, row.grade].filter(Boolean).join(" ");
        case "lid":
            // Production encodes the brand in the category, so it is not part of the lid name.
            return `Nắp ${row.shape}${row.grade ? ` ${lowerFirst(row.grade)}` : ""}`;
        case "bowlLid":
            return `Nắp tô giấy ${row.material}`;
        case "paper":
        case "bowl": {
            const base = `${row.kind === "bowl" ? "Tô giấy" : "Ly giấy"}${row.material === "kraft" ? " Kraft" : ""}`;
            const colors = row.printType?.colors === "multi" ? "In nhiều màu" : "In 1 màu";
            return `${[base, printSpec(row)].filter(Boolean).join(" ")} – ${colors}`;
        }
        case "accessory":
            return row.name;
    }
}

function keyParts(row: PriceRow): Array<string | number | null> {
    const { printType } = row;
    switch (row.kind) {
        case "cup":
            return [row.material, row.shape, row.color, row.brand, row.grade];
        case "lid":
            return [row.brand, familyName(row)];
        case "bowlLid":
            return [row.material];
        case "accessory":
            return [row.productId];
        case "paper":
        case "bowl":
            return [row.material, printType?.colors ?? null, printType?.pe ?? null, printType?.gsm ?? null, printType?.coatGsm ?? null];
    }
}

function keyOf(row: PriceRow): string {
    return [row.kind, ...keyParts(row)].map((part) => String(part ?? "").toLowerCase()).join("|");
}

function categoryOf(row: PriceRow): CategoryTarget | null {
    switch (row.kind) {
        case "cup":
            return row.material === "PP" ? CATEGORY.pp : row.material === "PET" ? CATEGORY.pet : null;
        case "lid":
            return row.brand === "UKP" ? CATEGORY.lidUkp : row.brand === "MVP" ? CATEGORY.lidMvp : null;
        case "paper":
            if (row.printType?.colors === "multi") return CATEGORY.paperColor;
            return row.printType?.pe === 1 ? CATEGORY.paper1 : row.printType?.pe === 2 ? CATEGORY.paper2 : null;
        case "bowl":
            return CATEGORY.bowl;
        case "bowlLid":
            return CATEGORY.bowlLid;
        case "accessory":
            return null;
    }
}

function blockerFor(row: PriceRow, productIds: string): string | null {
    const unknown = (what: string, fix = "") => `Chưa rõ ${what} (sản phẩm cũ ${productIds}) nên chưa chọn được danh mục${fix}`;
    switch (row.kind) {
        case "cup":
            return row.material ? null : unknown("chất liệu PP/PET", '; điền "material" vào overrides.json');
        case "lid":
            return row.brand === "UKP" || row.brand === "MVP" ? null : unknown("hãng nắp UKP/MVP", '; điền "brand" vào overrides.json');
        case "paper":
            return categoryOf(row) ? null : unknown("số lớp PE của ly giấy");
        default:
            return null;
    }
}

function toVariant(row: PriceRow): Variant {
    if (row.diameterMm === null) throw new Error(`product ${row.productId}: variant without a diameter`);
    return {
        capacityMl: row.capacityMl,
        diameterMm: row.diameterMm,
        priceTiers: [{ minQuantity: 1, unitPrice: row.unitPrice }],
        heightMm: row.heightMm,
        baseDiameterMm: row.baseDiameterMm,
        oz: row.oz,
        flags: row.flags,
        source: { productId: row.productId, variationId: row.variationId, slug: row.slug },
    };
}

function describe(kind: Kind, variants: Variant[], notes: string[]): string {
    if (kind !== "cup" && kind !== "paper" && kind !== "bowl") return "";
    const sizes = variants.map((v) => {
        const oz = v.oz ? ` (${v.oz})` : "";
        const height = v.heightMm ? `, cao ${v.heightMm}mm` : "";
        const base = v.baseDiameterMm ? `, đáy phi ${v.baseDiameterMm}` : "";
        return `${v.capacityMl}ml${oz}: phi ${v.diameterMm}${height}${base}`;
    });
    return ["Kích thước:", ...sizes, ...(notes.length > 0 ? ["", "Ghi chú sản phẩm:", ...notes] : [])].join("\n");
}

function buildFamily(key: string, rows: PriceRow[]): Family {
    const [first] = rows;
    const name = familyName(first);
    if (name.length > MAX_NAME_LENGTH) throw new Error(`family "${name}": name is longer than ${MAX_NAME_LENGTH} characters`);

    const variants = first.kind === "accessory" ? [] : rows.map(toVariant);
    variants.sort((a, b) => a.capacityMl - b.capacityMl || a.diameterMm - b.diameterMm);
    for (const [index, variant] of variants.entries()) {
        const clash = variants.slice(0, index).find((o) => o.capacityMl === variant.capacityMl && o.diameterMm === variant.diameterMm);
        if (clash) {
            const sizes = `${variant.capacityMl}ml / phi ${variant.diameterMm}`;
            throw new Error(
                `family "${name}": variants collide on ${sizes} (old products ${clash.source.productId} and ${variant.source.productId})`,
            );
        }
    }

    const byId = new Map(rows.map((row) => [row.productId, { productId: row.productId, slug: row.slug }]));
    const oldProducts = [...byId.values()].sort((a, b) => a.productId - b.productId);
    const productIds = oldProducts.map((product) => `#${product.productId}`).join(", ");
    const warnings: string[] = [];
    const flagged = [...new Set(rows.filter((row) => row.flags.includes("multi-capacity")).map((row) => `#${row.productId}`))];
    if (flagged.length > 0) {
        const detail = "ghi nhiều dung tích trong một tên (ví dụ 360/420ml): tách thành các biến thể cùng giá, cần xác nhận";
        warnings.push(`Sản phẩm cũ ${flagged.join(", ")} ${detail}`);
    }
    if (first.kind === "paper" && first.printType?.colors === "multi") {
        warnings.push(`Danh mục "${CATEGORY.paperColor.name}" cho ly in nhiều màu là phỏng đoán, cần xác nhận`);
    }

    let description = describe(first.kind, variants, rows.find((row) => row.notes.length > 0)?.notes ?? []);
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        description = description.slice(0, description.lastIndexOf("\n", MAX_DESCRIPTION_LENGTH));
        warnings.push(`Mô tả dài hơn ${MAX_DESCRIPTION_LENGTH} ký tự nên đã bị cắt bớt`);
    }

    const blocker = blockerFor(first, productIds);
    return {
        key,
        name,
        kind: first.kind,
        phase: KIND_PHASE[first.kind],
        category: categoryOf(first),
        description,
        variants,
        rowCount: new Set(rows.map((row) => `${row.productId}/${row.variationId}`)).size,
        oldProducts,
        avatarOldProductId: variants.length > 0 ? variants[Math.floor((variants.length - 1) / 2)].source.productId : null,
        warnings,
        blockers: blocker ? [blocker] : [],
    };
}

function categoryLabel(family: Family): string {
    return family.category ? String(family.category.id ?? `new:${family.category.name}`) : "unresolved";
}

/** Pivots price rows into families, in import order (see KIND_RANK). Throws on variant or name collisions. */
export function buildFamilies(rows: PriceRow[]): Family[] {
    const groups = new Map<string, PriceRow[]>();
    for (const row of rows) {
        const key = keyOf(row);
        groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    const families = [...groups].map(([key, members]) => buildFamily(key, members));
    const seen = new Map<string, Family>();
    for (const family of families) {
        const id = `${categoryLabel(family)}|${family.name.toLowerCase()}`;
        const other = seen.get(id);
        if (other) throw new Error(`families "${other.key}" and "${family.key}" share the name "${family.name}" in one category`);
        seen.set(id, family);
    }
    // Plain code-point comparison keeps the order (and so the plan hash) independent of the ICU version.
    const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    return families.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || compare(a.name, b.name) || compare(a.key, b.key));
}
