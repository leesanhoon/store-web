import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildFamilies, type Family } from "./families.ts";
import { loadSnapshot, type Snapshot } from "./fetch.ts";
import {
    clean,
    decodeEntities,
    htmlToText,
    loadOverrides,
    parseCatalog,
    parsePrintType,
    type Overrides,
    type PriceRow,
} from "./parse.ts";
import {
    buildPlan,
    fetchProduction,
    finalizePlan,
    hashPlanBody,
    parseTargetUrl,
    planBody,
    type PlanFamily,
    type Production,
} from "./plan.ts";
import { renderPlanReport } from "./report.ts";

// Hermetic: everything runs on the committed snapshot and inline production fixtures, no network.

const NO_OVERRIDES: Overrides = { products: {} };
const snapshot = await loadSnapshot();
const parsed = parseCatalog(snapshot, NO_OVERRIDES);
const families = buildFamilies(parsed.rows);

function must<T>(value: T | undefined, what: string): T {
    assert.ok(value !== undefined, `missing ${what}`);
    return value;
}

const family = (name: string, categoryId?: number): Family =>
    must(
        families.find((candidate) => candidate.name === name && (categoryId === undefined || candidate.category?.id === categoryId)),
        `family "${name}"`,
    );

function mutated(change: (copy: Snapshot) => void): Snapshot {
    const copy = structuredClone(snapshot);
    change(copy);
    return copy;
}

function oldProduct(copy: Snapshot, id: number) {
    return must(copy.products.find((product) => product.id === id), `product ${id}`);
}

function setPrices(copy: Snapshot, id: number, field: string, value: unknown) {
    const prices: Record<string, unknown> = oldProduct(copy, id).prices;
    prices[field] = value;
}

const rowsOf = (...kinds: PriceRow["kind"][]) => parsed.rows.filter((row) => kinds.includes(row.kind));
const distinctRows = (rows: PriceRow[]) => new Set(rows.map((row) => `${row.productId}/${row.variationId}`)).size;

// ---- Snapshot and parsing ------------------------------------------------------------------

test("snapshot has 62 products and 99 variations, all in whole VND", () => {
    assert.equal(snapshot.products.length, 62);
    assert.equal(snapshot.variations.length, 99);
    assert.ok([...snapshot.products, ...snapshot.variations].every((item) => item.prices.currency_minor_unit === 0));
});

test("every priced row parses: 123 rows, nothing to review, nothing dropped", () => {
    assert.equal(distinctRows(parsed.rows), 123);
    assert.deepEqual(parsed.needsReview, []);
    assert.deepEqual(parsed.dropped, []);
    assert.deepEqual(
        {
            cup: distinctRows(rowsOf("cup")),
            paper: distinctRows(rowsOf("paper", "bowl")),
            lid: distinctRows(rowsOf("lid", "bowlLid")),
            accessory: distinctRows(rowsOf("accessory")),
        },
        { cup: 65, paper: 21, lid: 27, accessory: 10 },
    );
});

test("58 products have a diameter and every cup, paper cup and bowl has a capacity", () => {
    const withDiameter = new Set(parsed.rows.filter((row) => row.diameterMm !== null).map((row) => row.productId));
    assert.equal(withDiameter.size, 58);
    assert.ok(rowsOf("cup", "paper", "bowl").every((row) => row.capacityMl > 0));
    assert.ok(rowsOf("lid", "bowlLid").every((row) => row.capacityMl === 0));
});

test("360/420ML becomes two flagged variants with the same price", () => {
    const rows = parsed.rows.filter((row) => row.variationId === 2604);
    assert.deepEqual(rows.map((row) => row.capacityMl), [360, 420]);
    assert.ok(rows.every((row) => row.unitPrice === 580 && row.flags.includes("multi-capacity")));
});

test("oz stays text and is never converted to ml", () => {
    const row = must(parsed.rows.find((candidate) => candidate.variationId === 2676), "variation 2676");
    assert.equal(row.capacityMl, 470);
    assert.equal(row.oz, "16oz");
    assert.equal(must(parsed.rows.find((candidate) => candidate.variationId === 2670), "variation 2670").oz, "12/14oz");
});

test("height and base diameter come from the label lines, lid diameters from the name or table", () => {
    const cup = must(parsed.rows.find((row) => row.variationId === 2675 || row.variationId === 2676), "cup row");
    assert.deepEqual([cup.diameterMm, cup.heightMm, cup.baseDiameterMm], [93, 133, 54.5]);
    const tableLid = must(parsed.rows.find((row) => row.productId === 2519), "lid 2519");
    assert.deepEqual([tableLid.diameterMm, tableLid.brand, tableLid.shape], [95, "MVP", "uống trực tiếp"]);
});

test("unparsable items go to needsReview instead of being guessed", () => {
    const copy = mutated((draft) => {
        const product = oldProduct(draft, 2591);
        product.name = "In Ly PP Bầu";
        product.short_description = "";
        product.description = "";
    });
    const result = parseCatalog(copy, NO_OVERRIDES);
    assert.deepEqual(result.needsReview.map((item) => item.productId), [2591]);
    assert.match(result.needsReview[0].reasons.join(" "), /dung tích/);
    assert.ok(!result.rows.some((row) => row.productId === 2591));
});

test("rows without a price are dropped and reported; a non-zero currency minor unit aborts", () => {
    const free = mutated((draft) => setPrices(draft, 2591, "price", "0"));
    assert.deepEqual(parseCatalog(free, NO_OVERRIDES).dropped.map((row) => row.productId), [2591]);
    const cents = mutated((draft) => setPrices(draft, 2591, "currency_minor_unit", 2));
    assert.throws(() => parseCatalog(cents, NO_OVERRIDES), /currency_minor_unit/);
});

test("products with suspicious text are not imported", () => {
    const copy = mutated((draft) => {
        oldProduct(draft, 2591).description = '<p>Dung tích (ml) 360</p><script>alert(1)</script>';
    });
    const result = parseCatalog(copy, NO_OVERRIDES);
    assert.match(result.needsReview[0].reasons.join(" "), /đáng ngờ/);
    assert.ok(!result.rows.some((row) => row.productId === 2591));
});

test("a hostile variation label is never imported into a family name", () => {
    const copy = mutated((draft) => {
        const variation = must(draft.variations.find((item) => item.id === 2525), "variation 2525");
        variation.variation = "Hãng: UKP </script><script>alert(1)</script> casino https://evil.example";
    });
    const result = parseCatalog(copy, NO_OVERRIDES);
    assert.deepEqual(result.needsReview.map((item) => [item.productId, item.variationId]), [[2524, 2525]]);
    assert.match(result.needsReview[0].reasons.join(" "), /đáng ngờ/);
    assert.ok(!result.rows.some((row) => row.variationId === 2525));
    assert.ok(!buildFamilies(result.rows).some((item) => /script|evil/i.test(item.name)));
});

test("entity-encoded markup in a description is not imported either", () => {
    const copy = mutated((draft) => {
        const product = oldProduct(draft, 2708);
        product.description += "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>";
    });
    const result = parseCatalog(copy, NO_OVERRIDES);
    assert.ok(result.needsReview.length > 0);
    assert.ok(result.needsReview.every((item) => item.productId === 2708 && /đáng ngờ/.test(item.reasons.join(" "))));
    assert.ok(!result.rows.some((row) => row.productId === 2708));
    assert.ok(!buildFamilies(result.rows).some((item) => /[<>]/.test(item.description)));
});

test("overrides only fill what the parser left empty and must name a real product", () => {
    const filled = parseCatalog(snapshot, { products: { "2663": { material: "PP" }, "2591": { material: "PET" } } });
    assert.equal(must(filled.rows.find((row) => row.productId === 2663), "row 2663").material, "PP");
    assert.equal(must(filled.rows.find((row) => row.productId === 2591), "row 2591").material, "PP");
    assert.throws(() => parseCatalog(snapshot, { products: { "1": { brand: "UKP" } } }), /not in the snapshot/);
});

test("overrides.json is valid as committed and rejects unknown fields or values", async () => {
    assert.deepEqual(await loadOverrides(), { products: {} });
    const dir = await mkdtemp(join(tmpdir(), "import-overrides-"));
    try {
        const path = join(dir, "overrides.json");
        const invalid = ['{"products": {"2663": {"material": "PVC"}}}', '{"products": {"2663": {"color": "red"}}}', '{"products": {"abc": {}}}', "[]"];
        for (const bad of invalid) {
            await writeFile(path, bad);
            await assert.rejects(loadOverrides(path), /expected \{"products"/);
        }
        await writeFile(path, '{"products": {"2663": {"material": "PP", "brand": "HT"}}}');
        assert.deepEqual(await loadOverrides(path), { products: { "2663": { material: "PP", brand: "HT" } } });
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});

test("text helpers", () => {
    assert.equal(decodeEntities("In Ly &#8211; Hãng &amp; &#x41;&nbsp;B &unknown;"), "In Ly – Hãng & A B &unknown;");
    assert.equal(clean("  Nắp\u00a0 cầu &#8211;  phi 98 "), "Nắp cầu – phi 98");
    const html = "<table><tr><td>Kích thước</td><td>Phi 95</td></tr><tr><td>Loại</td><td></td></tr></table><p>a<br />b</p>";
    assert.equal(htmlToText(html), "Kích thước Phi 95\nLoại\na\nb");
    assert.deepEqual(parsePrintType("In 1 màu 2PE 260 gsm"), { colors: "1", pe: 2, gsm: 260, coatGsm: null });
    assert.deepEqual(parsePrintType("In 1 màu 300gsm + 15gsm PE"), { colors: "1", pe: null, gsm: 300, coatGsm: 15 });
    assert.deepEqual(parsePrintType("In Nhiều Màu"), { colors: "multi", pe: null, gsm: null, coatGsm: null });
    assert.equal(parsePrintType("In 3 màu"), null);
});

// ---- Families ------------------------------------------------------------------------------

test("family counts: 22 plastic cups, 7 paper, 23 lids, 4 deferred accessories", () => {
    const count = (...kinds: Family["kind"][]) => families.filter((candidate) => kinds.includes(candidate.kind)).length;
    assert.deepEqual(
        { cup: count("cup"), paper: count("paper", "bowl"), lid: count("lid", "bowlLid"), accessory: count("accessory") },
        { cup: 22, paper: 7, lid: 23, accessory: 4 },
    );
    assert.equal(families.length, 56);
    const accessories = families.filter((candidate) => candidate.kind === "accessory");
    assert.equal(accessories.reduce((sum, candidate) => sum + candidate.rowCount, 0), 10);
    assert.ok(accessories.every((candidate) => candidate.phase === "C" && candidate.variants.length === 0));
});

test("no variant collisions, no duplicate names per category, every row used once", () => {
    for (const candidate of families) {
        const sizes = candidate.variants.map((variant) => `${variant.capacityMl}/${variant.diameterMm}`);
        assert.equal(new Set(sizes).size, sizes.length, candidate.name);
    }
    const names = families.map((entry) => `${entry.category?.id ?? entry.category?.name ?? "?"}|${entry.name.toLowerCase()}`);
    assert.equal(new Set(names).size, names.length);
    assert.equal(families.reduce((sum, candidate) => sum + candidate.variants.length, 0), parsed.rows.length - 10);
    assert.equal(families.reduce((sum, candidate) => sum + candidate.rowCount, 0), 123);
});

test("a collision inside a family is a hard error", () => {
    const row = must(parsed.rows.find((candidate) => candidate.kind === "cup"), "a cup row");
    assert.throws(() => buildFamilies([row, { ...row, variationId: 1, unitPrice: 1 }]), /collide/);
});

test("name generator", () => {
    const names = families.map((candidate) => candidate.name);
    for (const expected of [
        "Ly PP Bầu MVP Dày loại 1",
        "Ly PET Đen UKP Dày",
        "Ly PP UKP",
        "Ly giấy 2PE 260gsm – In 1 màu",
        "Ly giấy Kraft 1PE 280gsm – In 1 màu",
        "Ly giấy – In nhiều màu",
        "Tô giấy Kraft 300gsm + 15gsm PE – In 1 màu",
        "Nắp cầu",
        "Nắp cầu có đục X",
        "Nắp cầu đen có che",
        "Nắp bằng mỏng",
        "Nắp tô giấy PP",
    ]) {
        assert.ok(names.includes(expected), `missing "${expected}"`);
    }
    assert.ok(names.every((name) => name.length <= 200));
});

test("category mapping follows plan.md", () => {
    assert.equal(family("Ly PP Bầu MVP Dày loại 1").category?.id, 30);
    assert.equal(family("Ly PET UKP Dày loại 1").category?.id, 29);
    assert.equal(family("Ly giấy 2PE 260gsm – In 1 màu").category?.id, 32);
    assert.equal(family("Ly giấy Kraft 1PE 280gsm – In 1 màu").category?.id, 31);
    assert.equal(family("Ly giấy – In nhiều màu").category?.id, 33);
    assert.match(family("Ly giấy – In nhiều màu").warnings.join(" "), /phỏng đoán/);
    assert.deepEqual(family("Tô giấy Kraft 300gsm + 15gsm PE – In 1 màu").category, { id: null, name: "Tô giấy", parentId: 23 });
    assert.deepEqual(family("Nắp tô giấy PET").category, { id: null, name: "Nắp tô giấy", parentId: 20 });
    assert.equal(family("Nắp cầu", 21).variants[0].diameterMm, 95);
    assert.equal(family("Nắp cầu", 22).variants[0].diameterMm, 90);
});

test("unknown material or lid brand is flagged, never guessed", () => {
    for (const name of ["Ly Nắp Tim UKP Dày loại 1", "Ly Nắp Tim Đài Loan HT"]) {
        assert.equal(family(name).category, null);
        assert.match(family(name).blockers.join(" "), /material/);
    }
    const brandless = families.filter((candidate) => candidate.kind === "lid" && candidate.category === null);
    assert.equal(brandless.length, 6);
    assert.ok(brandless.every((candidate) => /brand/.test(candidate.blockers.join(" "))));
});

test("each variant carries one tier at quantity 1 with the old price", () => {
    const variant = must(family("Ly PP Bầu MVP Dày loại 1").variants.find((candidate) => candidate.capacityMl === 600), "600ml variant");
    assert.deepEqual(variant.priceTiers, [{ minQuantity: 1, unitPrice: 630 }]);
    assert.deepEqual(variant.source, { productId: 2581, variationId: 2582, slug: "in-ly-pp-bau-600ml-phi-95" });
    const tiers = families.flatMap((candidate) => candidate.variants.map((entry) => entry.priceTiers));
    assert.ok(tiers.every((list) => list.length === 1 && list[0].minQuantity === 1));
});

test("avatar is the median-capacity member; descriptions are short plain text", () => {
    assert.equal(family("Ly PP Bầu MVP Dày loại 1").avatarOldProductId, 2581);
    assert.equal(family("Ly PET UKP Dày loại 1").avatarOldProductId, 2693);
    const { description } = family("Ly giấy 2PE 260gsm – In 1 màu");
    assert.match(description, /^Kích thước:\n420ml \(14oz\): phi 90, cao 110mm, đáy phi 60/);
    assert.match(description, /Ghi chú sản phẩm:\n1PE/);
    assert.ok(families.every((candidate) => candidate.description.length <= 1000 && !/[<>]/.test(candidate.description)));
});

test("generated data carries no Bình Dương business data", () => {
    const forbidden = /Bình Dương|0828999599|0823999599|0906419128|3703155299|Thủ Dầu Một|8 năm|G-YFL4BKG30F|lystailor/i;
    assert.doesNotMatch(JSON.stringify(families), forbidden);
});

// ---- Plan ----------------------------------------------------------------------------------

const CATEGORIES = [
    { id: 20, name: "Nắp", parentId: null },
    { id: 21, name: "Nắp UKP", parentId: 20 },
    { id: 22, name: "Nắp MVP-VP", parentId: 20 },
    { id: 23, name: "Ly giấy", parentId: null },
    { id: 24, name: "Ly nhựa", parentId: null },
    { id: 29, name: "Ly Pet", parentId: 24 },
    { id: 30, name: "Ly PP", parentId: 24 },
    { id: 31, name: "Ly giấy 1 lớp", parentId: 23 },
    { id: 32, name: "Ly giấy 2 lớp", parentId: 23 },
    { id: 33, name: "Ly in offset", parentId: 23 },
];

const production = (...extra: Production["products"]): Production => ({ categories: CATEGORIES, products: extra });
type ProdProduct = Production["products"][number];

/** A production product with one variant whose cheapest tier (5000 pieces) is not its first tier (1000 pieces). */
const prodCup = (id: number, name: string, categoryId: number, capacityMl: number, diameterMm: number): ProdProduct => ({
    id,
    name,
    categoryId,
    variants: [
        {
            capacityMl,
            diameterMm,
            priceTiers: [
                { minQuantity: 5000, unitPrice: 700 },
                { minQuantity: 1000, unitPrice: 800 },
            ],
        },
    ],
});

function planWith(data: Production, hasImage = () => true) {
    return buildPlan({ snapshot, parsed, families, production: data, origin: new URL("https://api.example.test"), hasImage });
}

const planned = (body: ReturnType<typeof planWith>, name: string, categoryId?: number): PlanFamily =>
    must(
        body.families.find((candidate) => candidate.name === name && (categoryId === undefined || candidate.category?.id === categoryId)),
        `planned family "${name}"`,
    );

test("plan: empty production creates what is resolvable, flags the rest and defers accessories", () => {
    const body = planWith(production());
    assert.equal(body.families.length, 56);
    assert.deepEqual(
        Object.fromEntries(Object.entries(body.totals).map(([action, { families: count }]) => [action, count])),
        { create: 44, "skip-overlap": 0, "needs-decision": 8, deferred: 4 },
    );
    assert.deepEqual(body.categoriesToCreate, [
        { name: "Tô giấy", parentId: 23 },
        { name: "Nắp tô giấy", parentId: 20 },
    ]);
    assert.equal(planned(body, "Ly giấy 2PE 260gsm – In 1 màu").action, "create");
    assert.equal(planned(body, "Ống hút các loại (giá theo 1Kg)").action, "deferred");
    assert.equal(planned(body, "Ly Nắp Tim Đài Loan HT").action, "needs-decision");
    assert.deepEqual(body.target, {
        origin: "https://api.example.test",
        host: "api.example.test",
        productCount: 0,
        categoryCount: 10,
        maxProductId: 0,
    });
});

test("plan: overlap by category, capacity and diameter is skipped and reports the price delta", () => {
    const body = planWith(production(prodCup(69, "Ly Đáy Thường Loại 1", 30, 360, 95), prodCup(50, "Ly khác", 29, 360, 95)));
    const overlapped = planned(body, "Ly PP UKP Dày loại 1");
    assert.equal(overlapped.action, "skip-overlap");
    const variant = must(overlapped.variants.find((candidate) => candidate.capacityMl === 360), "360ml variant");
    assert.deepEqual(variant.overlaps, [
        { productId: 69, productName: "Ly Đáy Thường Loại 1", minQuantity: 1000, unitPrice: 800, delta: 510 - 800 },
    ]);
    assert.equal(planned(body, "Ly PP UKP Dày loại 2").action, "skip-overlap");
    assert.equal(planned(body, "Ly PET UKP Dày loại 1").action, "create");
});

test("plan: same name in the target category needs a decision even without overlap", () => {
    const body = planWith(production(prodCup(70, "ly pp ukp dày loại 1", 30, 999, 80)));
    const found = planned(body, "Ly PP UKP Dày loại 1");
    assert.equal(found.action, "needs-decision");
    assert.deepEqual(found.sameNameProductIds, [70]);
});

test("plan: a production category that no longer matches blocks its families", () => {
    const renamed = {
        ...production(),
        categories: CATEGORIES.map((category) => (category.id === 30 ? { ...category, name: "Ly nhựa PP" } : category)),
    };
    const body = planWith(renamed);
    assert.equal(planned(body, "Ly PP Bầu MVP Dày loại 1").action, "needs-decision");
    assert.match(planned(body, "Ly PP Bầu MVP Dày loại 1").reasons.join(" "), /không còn khớp/);
    const noParent = planWith({ ...production(), categories: CATEGORIES.filter((category) => category.id !== 23) });
    assert.equal(planned(noParent, "Tô giấy Kraft 300gsm + 15gsm PE – In 1 màu").action, "needs-decision");
});

test("plan: reuses a new-category target that production already has", () => {
    const existing = { ...production(), categories: [...CATEGORIES, { id: 34, name: "Tô giấy", parentId: 23 }] };
    const body = planWith(existing);
    const bowl = planned(body, "Tô giấy Kraft 300gsm + 15gsm PE – In 1 màu");
    assert.deepEqual(bowl.category, { id: 34, name: "Tô giấy", parentId: 23, isNew: false });
    assert.deepEqual(body.categoriesToCreate, [{ name: "Nắp tô giấy", parentId: 20 }]);
});

test("plan: a missing avatar image is a warning, not an error", () => {
    const body = planWith(production(), () => false);
    assert.match(planned(body, "Ly giấy 2PE 260gsm – In 1 màu").warnings.join(" "), /data\/images\/2723\.jpg/);
    assert.equal(planned(body, "Ly giấy 2PE 260gsm – In 1 màu").action, "create");
});

test("planSha256 covers the content but not the timestamp, and survives a JSON round trip", () => {
    const body = planWith(production());
    const first = finalizePlan(body, "2026-10-10T00:00:00.000Z");
    const second = finalizePlan(body, "2026-10-11T00:00:00.000Z");
    assert.match(first.planSha256, /^[0-9a-f]{64}$/);
    assert.equal(first.planSha256, second.planSha256);
    assert.equal(hashPlanBody(planBody(JSON.parse(JSON.stringify(first)))), first.planSha256);
    const changed = planWith(production(prodCup(69, "Ly Đáy Thường Loại 1", 30, 360, 95)));
    assert.notEqual(finalizePlan(changed).planSha256, first.planSha256);
});

test("report lists every group and the plan hash in Vietnamese", () => {
    const plan = finalizePlan(planWith(production(prodCup(69, "Ly Đáy Thường Loại 1", 30, 360, 95))));
    const report = renderPlanReport(plan);
    assert.ok(report.includes(plan.planSha256));
    const headings = ["## 1. Tóm tắt", "## 2. Cần anh/chị quyết định", "## 3. Trùng sản phẩm đang có", "## 9. Chi tiết từng nhóm"];
    for (const heading of headings) assert.ok(report.includes(heading), heading);
    for (const entry of plan.families) assert.ok(report.includes(entry.name), entry.name);
    assert.ok(report.includes("#69 Ly Đáy Thường Loại 1 (từ 1000 cái: 800đ, chênh -290đ)"));
    assert.doesNotMatch(report, /undefined|NaN|\[object/);
});

// ---- Target and production reads -----------------------------------------------------------

type Reply = { status: number; body: unknown };

/** A throw-away local backend that records every request it receives. */
async function withBackend<T>(
    reply: (url: URL) => Reply | undefined,
    run: (origin: string, seen: string[]) => Promise<T>,
): Promise<T> {
    const seen: string[] = [];
    const server = createServer((request, response) => {
        seen.push(`${request.method} ${request.url}${request.headers.authorization ? " (with credentials)" : ""}`);
        const found = reply(new URL(request.url ?? "/", "http://localhost"));
        response.writeHead(found?.status ?? 404, { "content-type": "application/json" });
        response.end(JSON.stringify(found?.body ?? {}));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        return await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, seen);
    } finally {
        server.closeAllConnections();
        server.close();
    }
}

test("fetchProduction warms up, pages through products and only ever sends credential-free GETs", async () => {
    const all = Array.from({ length: 150 }, (_, index) => prodCup(index + 1, `Sản phẩm ${index + 1}`, 30, 300, 90));
    const reply = (url: URL): Reply | undefined => {
        if (url.pathname === "/health") return { status: 200, body: "Healthy" };
        if (url.pathname === "/api/v1/Categories") return { status: 200, body: CATEGORIES };
        const page = Number(url.searchParams.get("page"));
        return url.pathname === "/api/v1/Products"
            ? { status: 200, body: { items: all.slice((page - 1) * 100, page * 100), totalCount: 150, page, pageSize: 100 } }
            : undefined;
    };
    await withBackend(reply, async (origin, seen) => {
        const result = await fetchProduction(origin);
        assert.equal(result.products.length, 150);
        assert.equal(result.categories.length, 10);
        assert.deepEqual(seen, [
            "GET /health",
            "GET /api/v1/Products?page=1&pageSize=100",
            "GET /api/v1/Products?page=2&pageSize=100",
            "GET /api/v1/Categories?page=1&pageSize=100",
        ]);
    });
});

test("fetchProduction fails fast on 4xx and on responses with an unexpected shape", async () => {
    const missing = (url: URL): Reply | undefined => (url.pathname === "/health" ? { status: 200, body: "Healthy" } : undefined);
    await withBackend(missing, async (origin, seen) => {
        await assert.rejects(fetchProduction(origin), /HTTP 404/);
        assert.equal(seen.length, 2, "a 404 is not retried");
    });
    const odd = (url: URL): Reply => {
        return { status: 200, body: url.pathname === "/health" ? "Healthy" : { items: [{ id: "x" }], totalCount: 1 } };
    };
    await withBackend(odd, async (origin) => {
        await assert.rejects(fetchProduction(origin), /unexpected response shape/);
    });
});

test("IMPORT_TARGET_URL is required and must be a bare https origin (http only for localhost)", () => {
    assert.throws(() => parseTargetUrl(undefined), /IMPORT_TARGET_URL is required/);
    assert.throws(() => parseTargetUrl("  "), /required/);
    assert.throws(() => parseTargetUrl("not a url"), /not a valid URL/);
    assert.throws(() => parseTargetUrl("http://api.example.test"), /https/);
    assert.throws(() => parseTargetUrl("https://api.example.test/api/v1"), /bare origin/);
    assert.throws(() => parseTargetUrl("https://user:pass@api.example.test"), /bare origin/);
    assert.equal(parseTargetUrl("https://api.example.test/").origin, "https://api.example.test");
    assert.equal(parseTargetUrl("http://localhost:5289").host, "localhost:5289");
});

test("the plan command refuses to run without IMPORT_TARGET_URL", () => {
    const env = { ...process.env };
    delete env.IMPORT_TARGET_URL;
    const result = spawnSync(process.execPath, [join(import.meta.dirname, "cli.ts"), "plan"], { env, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /IMPORT_TARGET_URL is required/);
});
