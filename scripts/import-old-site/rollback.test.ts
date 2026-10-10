import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runApply } from "./apply.ts";
import { DEFAULT_CATEGORIES, fakeProduct, startFakeBackend, type FakeBackend, type FakeProduct } from "./fake-backend.ts";
import type { Manifest } from "./manifest.ts";
import { finalizePlan, type Plan, type PlanBody, type PlanFamily } from "./plan.ts";
import { runRollback, type RollbackContext } from "./rollback.ts";
import { probeImage, runVerify, type ImageProbe, type VerifyContext } from "./verify.ts";

// Hermetic, like apply.test.ts: every test first runs the real `apply` against an in-process fake
// backend on 127.0.0.1 (so the manifest is a genuine one), then rolls back or verifies it. All files
// go to a throw-away directory. verify's tests live here too: both commands read the same manifest.

const CLI = join(import.meta.dirname, "cli.ts");
const BASELINE_MAX_PRODUCT_ID = 76;
const BASELINE_MAX_CATEGORY_ID = 33;
const TIMING = { gapMs: 0, retryDelayMs: 0, settleMs: 0, writeTimeoutMs: 5_000, warmUpAttempts: 1, readAttempts: 1 };

const avatarBytes = (oldProductId: number) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, oldProductId >> 8, oldProductId & 0xff]);
const imageUrl = (productId: number) => `https://res.cloudinary.test/products/${productId}.jpg`;

function variant(capacityMl: number, diameterMm: number, unitPrice: number, productId: number): PlanFamily["variants"][number] {
    return {
        capacityMl,
        diameterMm,
        priceTiers: [{ minQuantity: 1, unitPrice }],
        heightMm: null,
        baseDiameterMm: null,
        oz: null,
        flags: [],
        source: { productId, variationId: productId + 1, slug: `old-${productId}` },
        overlaps: [],
    };
}

function family(key: string, name: string, avatarOldProductId: number, overrides: Partial<PlanFamily>): PlanFamily {
    return {
        key,
        name,
        kind: "paper",
        phase: "A",
        description: `Mô tả ${name}`,
        rowCount: 1,
        oldProducts: [{ productId: avatarOldProductId, slug: `old-${avatarOldProductId}` }],
        avatarOldProductId,
        warnings: [],
        action: "create",
        reasons: [],
        category: { id: 31, name: "Ly giấy 1 lớp", parentId: 23, isNew: false },
        variants: [variant(270, 80, 810, avatarOldProductId), variant(360, 90, 910, avatarOldProductId)],
        sameNameProductIds: [],
        ...overrides,
    };
}

// Plan order is import order: new product ids 77, 78, 79; the new category gets id 34.
const FAMILIES = [
    family("paper|a", "Ly giấy A", 2001, { description: "Kích thước Phi 80\nDung tích 270" }),
    family("bowl|b", "Tô giấy B", 2002, {
        kind: "bowl",
        category: { id: null, name: "Tô giấy", parentId: 23, isNew: true },
        variants: [variant(500, 150, 1200, 2002)],
    }),
    family("lid|mvp", "Nắp cầu", 2003, {
        kind: "lid",
        phase: "B",
        category: { id: 22, name: "Nắp MVP-VP", parentId: 20, isNew: false },
        variants: [variant(0, 90, 300, 2003)],
    }),
];

function planFor(fake: FakeBackend): Plan {
    const created = { families: FAMILIES.length, variants: FAMILIES.reduce((sum, item) => sum + item.variants.length, 0) };
    const none = { families: 0, variants: 0 };
    const totals: PlanBody["totals"] = { create: created, "skip-overlap": none, "needs-decision": none, deferred: none };
    return finalizePlan(
        {
            schema: 1,
            target: {
                origin: fake.origin,
                host: fake.host,
                productCount: fake.products.length,
                categoryCount: fake.categories.length,
                maxProductId: Math.max(0, ...fake.products.map((product) => product.id)),
            },
            snapshot: { fetchedAt: "2026-10-10T00:00:00.000Z", source: "test", products: 0, variations: 0 },
            totals,
            categoriesToCreate: [{ name: "Tô giấy", parentId: 23 }],
            families: FAMILIES,
            needsReview: [],
            dropped: [],
        },
        "2026-10-10T00:00:00.000Z",
    );
}

type Setup = {
    fake: FakeBackend;
    outDir: string;
    logs: string[];
    rollback: RollbackContext;
    verify: VerifyContext;
};

async function withApplied(body: (setup: Setup) => Promise<void>) {
    const fake = await startFakeBackend({
        products: [
            // Already on production, so at or below the baseline: a rollback must never touch them.
            fakeProduct(70, "Nắp cầu", 22, [[0, 90]]),
            fakeProduct(75, "Có sẵn A", 30),
            fakeProduct(BASELINE_MAX_PRODUCT_ID, "Có sẵn B", 21, [[0, 95]]),
        ],
    });
    const dir = await mkdtemp(join(tmpdir(), "rollback-test-"));
    try {
        const outDir = join(dir, "out");
        await mkdir(outDir);
        const plan = planFor(fake);
        await writeFile(join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
        const env = { IMPORT_TARGET_URL: fake.origin, IMPORT_API_TOKEN: fake.token };
        await runApply(["--apply", "--confirm-host", fake.host, "--plan-sha", plan.planSha256], {
            env,
            outDir,
            decisionsPath: join(dir, "decisions.json"),
            readAvatar: async (id) => avatarBytes(id),
            timing: TIMING,
            log: () => undefined,
        });
        assert.deepEqual(
            fake.products.filter((product) => product.id > BASELINE_MAX_PRODUCT_ID).map((product) => product.id),
            [77, 78, 79],
            "the arrangement went wrong",
        );
        const logs: string[] = [];
        const log = (line: string) => void logs.push(line);
        await body({
            fake,
            outDir,
            logs,
            rollback: { env: { ...env }, outDir, timing: TIMING, log },
            verify: { env: { ...env }, outDir, timing: TIMING, probeImage: async () => ({ status: 200, contentType: "image/jpeg" }), log },
        });
    } finally {
        await fake.close();
        await rm(dir, { recursive: true, force: true });
    }
}

const GO = (setup: Setup) => ["--rollback", "--confirm-host", setup.fake.host];
// By id: production already has a look-alike called "Nắp cầu" below the baseline.
const productWithId = (fake: FakeBackend, id: number): FakeProduct => {
    const found = fake.products.find((product) => product.id === id);
    assert.ok(found, `product #${id} is not on the fake backend`);
    return found;
};
const productIds = (fake: FakeBackend) => fake.products.map((product) => product.id).sort((a, b) => a - b);
const deletes = (fake: FakeBackend) => fake.requests.filter((request) => request.method === "DELETE").map((request) => request.path.toLowerCase());

async function editManifest(setup: Setup, edit: (manifest: Manifest) => void) {
    const path = join(setup.outDir, "manifest.json");
    const manifest = JSON.parse(await readFile(path, "utf8")) as Manifest;
    edit(manifest);
    await writeFile(path, JSON.stringify(manifest, null, 2));
}

async function journal(setup: Setup): Promise<Array<Record<string, unknown>>> {
    const text = await readFile(join(setup.outDir, "journal.jsonl"), "utf8");
    return text.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

// ---- rollback: gates -----------------------------------------------------------------------

const REFUSALS: Array<{ name: string; args: (setup: Setup) => string[]; change?: (setup: Setup) => void | Promise<void>; message: RegExp }> = [
    { name: "no flag is given", args: () => [], message: /--rollback is required[^]*--confirm-host is required/ },
    { name: "--confirm-host is missing", args: () => ["--rollback"], message: /--confirm-host is required/ },
    { name: "--rollback is missing", args: (s) => ["--confirm-host", s.fake.host], message: /--rollback is required/ },
    {
        name: "--confirm-host is another host",
        args: () => ["--rollback", "--confirm-host", "example.com"],
        message: /not the host of IMPORT_TARGET_URL/,
    },
    {
        name: "IMPORT_API_TOKEN is not set",
        args: GO,
        change: (s) => void delete s.rollback.env.IMPORT_API_TOKEN,
        message: /IMPORT_API_TOKEN is not set/,
    },
    {
        name: "IMPORT_TARGET_URL is not set",
        args: GO,
        change: (s) => void delete s.rollback.env.IMPORT_TARGET_URL,
        message: /IMPORT_TARGET_URL is required and has no default/,
    },
    {
        name: "the manifest belongs to another backend",
        args: GO,
        change: (s) => editManifest(s, (manifest) => void (manifest.target = { origin: "https://other.example", host: "other.example" })),
        message: /out\/manifest\.json is for https:\/\/other\.example/,
    },
    {
        name: "the manifest is not valid JSON",
        args: GO,
        change: (s) => writeFile(join(s.outDir, "manifest.json"), "{"),
        message: /is not valid JSON/,
    },
    { name: "--rollback and --dry-run are both given", args: () => ["--rollback", "--dry-run"], message: /contradict/ },
];

for (const { name, args, change, message } of REFUSALS) {
    test(`rollback refuses before any request or file change when ${name}`, async () => {
        await withApplied(async (setup) => {
            await change?.(setup);
            const requests = setup.fake.requests.length;
            const files = await readdir(setup.outDir);
            await assert.rejects(runRollback(args(setup), setup.rollback), message);
            assert.equal(setup.fake.requests.length, requests, "no request may be sent");
            assert.deepEqual(await readdir(setup.outDir), files, "nothing may be written");
        });
    });
}

test("--dry-run needs no token and no --confirm-host, only reads, and says what it would delete", async () => {
    await withApplied(async (setup) => {
        delete setup.rollback.env.IMPORT_API_TOKEN;
        const requests = setup.fake.requests.length;
        const files = await readdir(setup.outDir);
        const products = productIds(setup.fake);
        await runRollback(["--dry-run"], setup.rollback);

        assert.ok(setup.fake.requests.slice(requests).every((request) => request.method === "GET"), "a preview may only read");
        assert.deepEqual(productIds(setup.fake), products);
        assert.deepEqual(await readdir(setup.outDir), files);
        const output = setup.logs.join("\n");
        for (const label of ['product #79 "Nắp cầu"', 'product #78 "Tô giấy B"', 'product #77 "Ly giấy A"', 'category #34 "Tô giấy"']) {
            assert.ok(output.includes(`delete  ${label}`), `missing: ${label}`);
        }
        assert.match(output, /Dry run: nothing was deleted/);
    });
});

test("nothing happens when there is no manifest (apply never ran, or it was rolled back already)", async () => {
    await withApplied(async (setup) => {
        await rm(join(setup.outDir, "manifest.json"));
        const requests = setup.fake.requests.length;
        await runRollback(GO(setup), setup.rollback);
        assert.equal(setup.fake.requests.length, requests);
        assert.match(setup.logs.join("\n"), /Nothing to roll back/);
    });
});

// ---- rollback: deletes ---------------------------------------------------------------------

test("deletes what apply created, newest first, products before the category, and nothing else", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        await runRollback(GO(setup), setup.rollback);

        assert.deepEqual(deletes(fake), ["/api/v1/products/79", "/api/v1/products/78", "/api/v1/products/77", "/api/v1/categories/34"]);
        for (const request of fake.requests.filter((candidate) => candidate.method === "DELETE")) {
            assert.equal(request.authorization, `Bearer ${fake.token}`);
        }
        assert.deepEqual(productIds(fake), [70, 75, 76], "production is back to the baseline");
        assert.deepEqual(fake.categories, DEFAULT_CATEGORIES);

        const files = await readdir(setup.outDir);
        assert.ok(!files.includes("manifest.json"), "the manifest is archived, so apply cannot believe the products still exist");
        assert.ok(files.some((file) => /^manifest\.rolled-back-.+\.json$/.test(file)));
        for (const kept of ["baseline.json", "plan.json", "journal.jsonl"]) assert.ok(files.includes(kept), `${kept} stays`);
        assert.equal(
            await readFile(join(setup.outDir, "orphan-images.txt"), "utf8"),
            `${[77, 78, 79].map(imageUrl).join("\n")}\n`,
            "the Cloudinary images that stay behind",
        );
        assert.match(setup.logs.join("\n"), /3 image\(s\) stay on Cloudinary/);

        const events = (await journal(setup)).filter((entry) => String(entry.event).startsWith("rollback"));
        assert.deepEqual(
            events.map((entry) => `${entry.event} ${entry.kind ?? ""} ${entry.id ?? ""} ${entry.outcome ?? ""}`.trim()),
            [
                "rollback",
                ...[["product", 79], ["product", 78], ["product", 77], ["category", 34]].flatMap(([kind, id]) => [
                    `rollback-intent ${kind} ${id}`,
                    `rollback-result ${kind} ${id} deleted`,
                ]),
            ],
            "every delete is journaled before and after",
        );
        for (const file of files) {
            assert.ok(!(await readFile(join(setup.outDir, file), "utf8")).includes(fake.token), `${file} holds the token`);
        }
    });
});

test("running it again after a complete rollback sends nothing", async () => {
    await withApplied(async (setup) => {
        await runRollback(GO(setup), setup.rollback);
        const requests = setup.fake.requests.length;
        await runRollback(GO(setup), setup.rollback);
        assert.equal(setup.fake.requests.length, requests);
        assert.match(setup.logs.at(-1) ?? "", /Nothing to roll back/);
    });
});

test("a partial rollback keeps the manifest, and the re-run deletes only what is left", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        fake.fail({ method: "DELETE", name: "Tô giấy B", status: 500 });

        await assert.rejects(runRollback(GO(setup), setup.rollback), /rollback incomplete: 0 kept and 2 failed/);
        // The refused product still sits in its category, so the backend refuses the category as well.
        assert.deepEqual(productIds(fake), [70, 75, 76, 78]);
        assert.ok(fake.categories.some((category) => category.id === 34));
        assert.ok((await readdir(setup.outDir)).includes("manifest.json"), "the manifest stays until everything is gone");
        assert.equal(
            await readFile(join(setup.outDir, "orphan-images.txt"), "utf8"),
            `${[77, 79].map(imageUrl).join("\n")}\n`,
            "only the deleted products' images",
        );

        const requests = fake.requests.length;
        await runRollback(GO(setup), setup.rollback);
        assert.deepEqual(
            fake.requests.slice(requests).filter((request) => request.method === "DELETE").map((request) => request.path.toLowerCase()),
            ["/api/v1/products/78", "/api/v1/categories/34"],
            "ids that are already gone are not asked for again",
        );
        assert.deepEqual(productIds(fake), [70, 75, 76]);
        assert.deepEqual(fake.categories, DEFAULT_CATEGORIES);
        assert.ok(!(await readdir(setup.outDir)).includes("manifest.json"));
        assert.equal(await readFile(join(setup.outDir, "orphan-images.txt"), "utf8"), `${[77, 78, 79].map(imageUrl).join("\n")}\n`);
    });
});

test("a product whose name no longer matches is kept, and only a restored name lets the rollback finish", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        const edited = productWithId(fake, 77);
        edited.name = "Đã đổi tên tay";

        await assert.rejects(runRollback(GO(setup), setup.rollback), /rollback incomplete: 1 kept and 0 failed/);
        assert.deepEqual(productIds(fake), [70, 75, 76, 77], "everything else is gone, the renamed product is untouched");
        assert.match(setup.logs.join("\n"), /keep +product #77 "Ly giấy A" \(the backend now has "Đã đổi tên tay" there/);
        assert.ok(!deletes(fake).includes("/api/v1/products/77"));
        assert.ok(!(await readFile(join(setup.outDir, "orphan-images.txt"), "utf8")).includes(imageUrl(77)));

        await assert.rejects(runRollback(GO(setup), setup.rollback), /1 kept/, "a second run still refuses it");
        assert.ok(!deletes(fake).includes("/api/v1/products/77"));

        edited.name = "Ly giấy A";
        await runRollback(GO(setup), setup.rollback);
        assert.deepEqual(productIds(fake), [70, 75, 76]);
    });
});

test("it never deletes an id outside the manifest or at or below the baseline, even when the manifest names one", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        fake.products.push(fakeProduct(80, "Thêm tay sau khi nhập", 30));
        await editManifest(setup, (manifest) => {
            // A manifest that points at products and a category that existed before the import, names matching.
            manifest.products[0].id = BASELINE_MAX_PRODUCT_ID;
            manifest.products[0].name = "Có sẵn B";
            manifest.categories[0].id = BASELINE_MAX_CATEGORY_ID;
            manifest.categories[0].name = "Ly in offset";
            manifest.categories[0].parentId = 23;
        });

        await assert.rejects(runRollback(GO(setup), setup.rollback), /rollback incomplete: 2 kept and 0 failed/);
        assert.deepEqual(deletes(fake), ["/api/v1/products/79", "/api/v1/products/78"], "only the entries that are above the baseline");
        assert.deepEqual(productIds(fake), [70, 75, 76, 77, 80]);
        assert.ok(fake.categories.some((category) => category.id === 33), "the baseline category stays");
        assert.ok(fake.categories.some((category) => category.id === 34), "a category the manifest no longer lists stays");
        assert.match(setup.logs.join("\n"), /its id is at or below the baseline/);
    });
});

test("an entry without an id is never deleted: a look-alike is reported, a write that never happened is ignored", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        await editManifest(setup, (manifest) => {
            Object.assign(manifest.products[0], { id: null, state: "pending" });
            const ghost = { ...structuredClone(manifest.products[1]), familyKey: "ghost", name: "Không có thật", id: null, state: "failed" } as const;
            manifest.products.push(ghost);
        });

        await assert.rejects(runRollback(GO(setup), setup.rollback), /rollback incomplete: 1 kept and 0 failed/);
        assert.deepEqual(deletes(fake), ["/api/v1/products/79", "/api/v1/products/78", "/api/v1/categories/34"]);
        assert.deepEqual(productIds(fake), [70, 75, 76, 77]);
        const output = setup.logs.join("\n");
        assert.match(output, /keep +product #77 "Ly giấy A" \(it may be the unsettled write of the manifest entry "Ly giấy A", which has no id/);
        assert.ok(!output.includes("Không có thật"), "an entry that left nothing behind is not mentioned");
    });
});

test("a rejected token stops the rollback at the first delete and leaves everything resumable", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        fake.expireToken();
        await assert.rejects(runRollback(GO(setup), setup.rollback), /HTTP 401[^]*expired or not an admin token[^]*IMPORT_API_TOKEN/);
        assert.equal(deletes(fake).length, 1, "it stops at once");
        assert.deepEqual(productIds(fake), [70, 75, 76, 77, 78, 79]);
        assert.ok((await readdir(setup.outDir)).includes("manifest.json"));
        const events = (await journal(setup)).map((entry) => entry.event);
        assert.equal(events.at(-1), "rollback-stop");
    });
});

test("three deletes in a row that get no answer stop the rollback", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        setup.rollback.timing = { ...TIMING, writeTimeoutMs: 150 };
        fake.fail({ method: "DELETE", hang: true, times: 3 });
        await assert.rejects(runRollback(GO(setup), setup.rollback), /stopping after 3 deletes in a row that got no answer[^]*timed out/);
        assert.equal(deletes(fake).length, 3, "the category is never tried");
        assert.deepEqual(productIds(fake), [70, 75, 76, 77, 78, 79]);
    });
});

test("a backend that answers 500 for one product does not stop the rest", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        fake.fail({ method: "DELETE", name: "Tô giấy B", status: 500, times: 5 });
        await assert.rejects(runRollback(GO(setup), setup.rollback), /2 failed/);
        assert.deepEqual(deletes(fake).slice(0, 3), ["/api/v1/products/79", "/api/v1/products/78", "/api/v1/products/77"]);
        assert.match(setup.logs.join("\n"), /FAILED +product #78 "Tô giấy B": DELETE .*HTTP 500/);
    });
});

// ---- verify --------------------------------------------------------------------------------

test("verify passes right after apply, with reads only, and checks every avatar", async () => {
    await withApplied(async (setup) => {
        const probed: string[] = [];
        setup.verify.probeImage = async (url) => {
            probed.push(url.href);
            return { status: 200, contentType: "image/jpeg" };
        };
        const requests = setup.fake.requests.length;
        await runVerify([], setup.verify);

        assert.ok(setup.fake.requests.slice(requests).every((request) => request.method === "GET"), "verify may only read");
        assert.ok(setup.fake.requests.slice(requests).every((request) => request.authorization === null), "verify sends no credentials");
        assert.equal(productWithId(setup.fake, 77).description, "Kích thước Phi 80\r\nDung tích 270", "a multipart form turns line breaks into CRLF");
        assert.deepEqual(probed, [77, 78, 79].map(imageUrl));
        const output = setup.logs.join("\n");
        assert.match(output, /category +#34 +Tô giấy +ok/);
        assert.match(output, /product +#77 +Ly giấy A +ok +2\/2 +2\/2 +ok +ok +OK/);
        assert.match(output, /product +#79 +Nắp cầu +ok +1\/1 +1\/1 +ok +ok +OK/);
        assert.match(output, /All 4 manifest entries match/);
        assert.ok(!output.includes("Note:"));
    });
});

test("verify names every mismatch and exits non-zero", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        const paper = productWithId(fake, 77);
        paper.variants.pop();
        paper.description = "Mô tả khác";
        productWithId(fake, 79).categoryId = 21;
        fake.categories.splice(fake.categories.findIndex((category) => category.id === 34), 1);
        setup.verify.probeImage = async (url) => ({ status: url.href === imageUrl(79) ? 404 : 200, contentType: "image/jpeg" });

        await assert.rejects(runVerify([], setup.verify), /3 of 4 manifest entries do not match/);
        const output = setup.logs.join("\n");
        assert.match(output, /product +#77 +Ly giấy A +ok +1\/2 +1\/2 +FAIL +ok +FAIL/);
        assert.match(output, /product +#78 +Tô giấy B +ok +1\/1 +1\/1 +ok +ok +OK/);
        assert.match(output, /there is no variant 360 ml \/ 90 mm/);
        assert.match(output, /the description differs/);
        assert.match(output, /it is in category #21, expected #22/);
        assert.match(output, /the avatar answers HTTP 404: https:\/\/res\.cloudinary\.test\/products\/79\.jpg/);
        assert.match(output, /#34 is not on the backend/);
    });
});

test("verify reports a missing or renamed product, a price tier count that differs, and an extra variant", async () => {
    await withApplied(async (setup) => {
        const { fake } = setup;
        fake.products.splice(fake.products.indexOf(productWithId(fake, 78)), 1);
        productWithId(fake, 79).name = "Nắp đổi tên";
        const paper = productWithId(fake, 77);
        paper.variants[0].priceTiers.push({ id: 9_000_001, minQuantity: 5000, unitPrice: 700 });
        paper.variants.push({ id: 9_000_002, capacityMl: 500, diameterMm: 90, priceTiers: [{ id: 9_000_003, minQuantity: 1, unitPrice: 1 }] });

        await assert.rejects(runVerify([], setup.verify), /3 of 4 manifest entries do not match/);
        const output = setup.logs.join("\n");
        assert.match(output, /#78 is not on the backend/);
        assert.match(output, /#79 is named "Nắp đổi tên" on the backend, not "Nắp cầu"/);
        assert.match(output, /variant 270 ml \/ 80 mm has 2 price tier\(s\), expected 1/);
        assert.match(output, /1 variant\(s\) on the backend are not in the manifest/);
        assert.match(output, /product +#77 +Ly giấy A +ok +2\/2 \+1 +3\/2/);
    });
});

test("verify tells apart a missing, unreachable, non-image and wrong avatar", async () => {
    await withApplied(async (setup) => {
        productWithId(setup.fake, 78).avatarImageUrl = null;
        productWithId(setup.fake, 79).avatarImageUrl = "ftp://res.cloudinary.test/79.jpg";
        setup.verify.probeImage = async (url): Promise<ImageProbe> => {
            if (url.href === imageUrl(77)) throw new Error("fetch failed", { cause: Object.assign(new Error("lookup"), { code: "ENOTFOUND" }) });
            return { status: 200, contentType: "text/html" };
        };
        await assert.rejects(runVerify([], setup.verify), /3 of 4 manifest entries/);
        const output = setup.logs.join("\n");
        assert.match(output, /the avatar is unreachable \(fetch failed \(ENOTFOUND\)\)/);
        assert.match(output, /the backend has no avatar image/);
        assert.match(output, /the avatar URL is not http\(s\)/);
        assert.ok(!output.includes("not an image"), "a URL that was never fetched has no content type");
    });
});

test("verify only notes, and does not fail on, a product above the baseline that the manifest does not list", async () => {
    await withApplied(async (setup) => {
        setup.fake.products.push(fakeProduct(80, "Thêm tay", 30));
        await runVerify([], setup.verify);
        assert.match(setup.logs.join("\n"), /Note: 1 product\(s\) above the baseline are not in the manifest[^\n]*#80 "Thêm tay"/);
    });
});

test("verify counts an unsettled manifest entry as a mismatch", async () => {
    await withApplied(async (setup) => {
        await editManifest(setup, (manifest) => void Object.assign(manifest.products[0], { id: null, state: "failed" }));
        await assert.rejects(runVerify([], setup.verify), /1 of 4 manifest entries/);
        assert.match(setup.logs.join("\n"), /not settled in the manifest \(state failed\)/);
    });
});

test("verify refuses without a target, a manifest, a manifest for this backend, or any product in it", async () => {
    await withApplied(async (setup) => {
        await assert.rejects(runVerify([], { ...setup.verify, env: {} }), /IMPORT_TARGET_URL is required and has no default/);

        await editManifest(setup, (manifest) => void (manifest.target = { origin: "https://other.example", host: "other.example" }));
        await assert.rejects(runVerify([], setup.verify), /out\/manifest\.json is for https:\/\/other\.example/);

        const target = { origin: setup.fake.origin, host: setup.fake.host };
        await editManifest(setup, (manifest) => void Object.assign(manifest, { target, products: [] }));
        await assert.rejects(runVerify([], setup.verify), /lists no products/);

        await rm(join(setup.outDir, "manifest.json"));
        await assert.rejects(runVerify([], setup.verify), /run "apply" first/);
    });
});

test("the real image probe uses HEAD, falls back to GET when HEAD is refused, and reports the status", async () => {
    const seen: string[] = [];
    const server = createServer((request, response) => {
        seen.push(`${request.method} ${request.url}`);
        if (request.url === "/missing.jpg") return void response.writeHead(404).end();
        if (request.url === "/no-head.jpg" && request.method === "HEAD") return void response.writeHead(405).end();
        const type = request.url === "/page.html" ? "text/html" : "image/jpeg";
        response.writeHead(200, { "content-type": type }).end(request.method === "HEAD" ? undefined : "x");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
        assert.deepEqual(await probeImage(new URL("/ok.jpg", base)), { status: 200, contentType: "image/jpeg" });
        assert.deepEqual(await probeImage(new URL("/no-head.jpg", base)), { status: 200, contentType: "image/jpeg" });
        assert.deepEqual(await probeImage(new URL("/missing.jpg", base)), { status: 404, contentType: null });
        assert.deepEqual(await probeImage(new URL("/page.html", base)), { status: 200, contentType: "text/html" });
        assert.deepEqual(seen, ["HEAD /ok.jpg", "HEAD /no-head.jpg", "GET /no-head.jpg", "HEAD /missing.jpg", "HEAD /page.html"]);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
});

// ---- CLI -----------------------------------------------------------------------------------

test("the CLI wiring: verify and rollback are subcommands, --help works, and a real run without a target refuses", () => {
    const env = { PATH: process.env.PATH ?? "" };
    const run = (...args: string[]) => spawnSync(process.execPath, [CLI, ...args], { env, encoding: "utf8" });

    const listing = run("--help");
    assert.match(listing.stdout, /^ {2}verify /m);
    assert.match(listing.stdout, /^ {2}rollback /m);
    assert.match(run("verify", "--help").stdout, /Usage: .*cli\.ts verify/);
    assert.match(run("rollback", "--help").stdout, /Usage: .*rollback \[options\]/);

    const refused = run("rollback");
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /refusing to roll back, nothing was sent or written/);
    assert.match(refused.stderr, /--rollback is required/);
    assert.match(refused.stderr, /IMPORT_TARGET_URL is required and has no default/);

    const unverified = run("verify");
    assert.equal(unverified.status, 1);
    assert.match(unverified.stderr, /IMPORT_TARGET_URL is required and has no default/);
});
