import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runApply, type ApplyContext } from "./apply.ts";
import { AuthError, BackendError, createBackend, type Backend } from "./backend.ts";
import { fakeProduct, startFakeBackend, type FakeBackend, type FakeRequest } from "./fake-backend.ts";
import type { Manifest } from "./manifest.ts";
import { finalizePlan, planBody, type Plan, type PlanBody, type PlanFamily } from "./plan.ts";

// Hermetic: the importer talks to an in-process fake backend on 127.0.0.1 and writes into a
// throw-away directory. Nothing leaves the machine and nothing in the repository is touched.

const CLI = join(import.meta.dirname, "cli.ts");
const BASELINE_MAX_PRODUCT_ID = 76;
const BASELINE_MAX_CATEGORY_ID = 33;

const avatarBytes = (oldProductId: number) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, oldProductId >> 8, oldProductId & 0xff]);

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

function family(key: string, name: string, avatarOldProductId: number | null, overrides: Partial<PlanFamily> = {}): PlanFamily {
    const id = avatarOldProductId ?? 0;
    return {
        key,
        name,
        kind: "paper",
        phase: "A",
        description: `Mô tả ${name}`,
        rowCount: 2,
        oldProducts: [{ productId: id, slug: `old-${id}` }],
        avatarOldProductId,
        warnings: [],
        action: "create",
        reasons: [],
        category: { id: 31, name: "Ly giấy 1 lớp", parentId: 23, isNew: false },
        variants: [variant(270, 80, 810, id), variant(360, 90, 910, id)],
        sameNameProductIds: [],
        ...overrides,
    };
}

const MVP_LIDS = { id: 22, name: "Nắp MVP-VP", parentId: 20, isNew: false };
const UKP_LIDS = { id: 21, name: "Nắp UKP", parentId: 20, isNew: false };

// Plan order is import order. `create` families need no decision; the other two do.
const PAPER = family("paper|a", "Ly giấy A", 2001);
const BOWL = family("bowl|b", "Tô giấy B", 2002, { kind: "bowl", category: { id: null, name: "Tô giấy", parentId: 23, isNew: true } });
const LID = family("lid|mvp", "Nắp cầu", 2003, { kind: "lid", phase: "B", category: MVP_LIDS, variants: [variant(0, 90, 300, 2003)] });
const OVERLAP = family("lid|ukp", "Nắp cầu", 2004, {
    kind: "lid",
    phase: "B",
    action: "skip-overlap",
    reasons: ["Trùng"],
    category: UKP_LIDS,
    variants: [variant(0, 95, 280, 2004)],
});
const UNKNOWN = family("lid||tim", "Nắp tim", 2005, {
    kind: "lid",
    phase: "B",
    action: "needs-decision",
    reasons: ["Chưa rõ hãng nắp"],
    category: null,
    variants: [variant(0, 98, 270, 2005)],
});
const ACCESSORY = family("accessory|1", "Ống hút", null, { kind: "accessory", phase: "C", action: "deferred", category: null, variants: [] });
const FAMILIES = [PAPER, BOWL, LID, OVERLAP, UNKNOWN, ACCESSORY];
const DECISIONS = { families: { "lid|ukp": { action: "skip" }, "lid||tim": { action: "import", categoryId: 22 } } };

function planFor(fake: FakeBackend, families: PlanFamily[]): Plan {
    const totals: PlanBody["totals"] = {
        create: { families: 0, variants: 0 },
        "skip-overlap": { families: 0, variants: 0 },
        "needs-decision": { families: 0, variants: 0 },
        deferred: { families: 0, variants: 0 },
    };
    for (const item of families) {
        totals[item.action].families++;
        totals[item.action].variants += item.variants.length;
    }
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
            families,
            needsReview: [],
            dropped: [],
        },
        "2026-10-10T00:00:00.000Z",
    );
}

type Flags = Record<string, string | true>;
type Setup = {
    fake: FakeBackend;
    dir: string;
    plan: Plan;
    ctx: ApplyContext;
    flags: Flags;
    logs: string[];
    /** Whether out/baseline.json already existed at each write the backend received. */
    baselineAtWrite: boolean[];
};

const argv = (flags: Flags) => Object.entries(flags).flatMap(([name, value]) => (value === true ? [name] : [name, value]));
const run = (setup: Setup) => runApply(argv(setup.flags), setup.ctx);
const posts = (fake: FakeBackend, path: string) => fake.requests.filter((request) => request.method === "POST" && request.path === path);
const writes = (fake: FakeBackend): FakeRequest[] => fake.requests.filter((request) => request.method !== "GET");
const newProducts = (fake: FakeBackend) => fake.products.filter((product) => product.id > BASELINE_MAX_PRODUCT_ID);

async function readManifest(setup: Setup): Promise<Manifest> {
    return JSON.parse(await readFile(join(setup.ctx.outDir, "manifest.json"), "utf8")) as Manifest;
}

async function readJournal(setup: Setup): Promise<Array<Record<string, unknown>>> {
    const text = await readFile(join(setup.ctx.outDir, "journal.jsonl"), "utf8");
    return text.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

async function withSetup(body: (setup: Setup) => Promise<void>, options: { decisions?: unknown } = {}) {
    const baselineAtWrite: boolean[] = [];
    let outDir = "";
    const fake = await startFakeBackend({
        products: [
            // Already on production, so at or below the baseline: the importer must never adopt it.
            fakeProduct(70, "Nắp cầu", 22, [[0, 90]]),
            fakeProduct(75, "Có sẵn A", 30),
            fakeProduct(BASELINE_MAX_PRODUCT_ID, "Có sẵn B", 21, [[0, 95]]),
        ],
        onWrite: () => void baselineAtWrite.push(existsSync(join(outDir, "baseline.json"))),
    });
    const dir = await mkdtemp(join(tmpdir(), "apply-test-"));
    try {
        outDir = join(dir, "out");
        await mkdir(outDir);
        const plan = planFor(fake, FAMILIES);
        await writeFile(join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
        const decisionsPath = join(dir, "decisions.json");
        await writeFile(decisionsPath, JSON.stringify(options.decisions ?? DECISIONS));
        const logs: string[] = [];
        const setup: Setup = {
            fake,
            dir,
            plan,
            logs,
            baselineAtWrite,
            flags: { "--apply": true, "--confirm-host": fake.host, "--plan-sha": plan.planSha256 },
            ctx: {
                env: { IMPORT_TARGET_URL: fake.origin, IMPORT_API_TOKEN: fake.token },
                outDir,
                decisionsPath,
                readAvatar: async (id) => avatarBytes(id),
                timing: { gapMs: 0, retryDelayMs: 0, settleMs: 0, writeTimeoutMs: 5_000, warmUpAttempts: 1, readAttempts: 1 },
                log: (line) => logs.push(line),
            },
        };
        await body(setup);
    } finally {
        await fake.close();
        await rm(dir, { recursive: true, force: true });
    }
}

// ---- Gates ---------------------------------------------------------------------------------

async function replacePlan(setup: Setup, plan: Plan) {
    await writeFile(join(setup.ctx.outDir, "plan.json"), JSON.stringify(plan, null, 2));
    setup.flags["--plan-sha"] = plan.planSha256;
}

const REFUSALS: Array<{ name: string; change: (setup: Setup) => void | Promise<void>; message: RegExp }> = [
    { name: "--confirm-host is missing", change: (s) => void delete s.flags["--confirm-host"], message: /--confirm-host is required/ },
    { name: "--confirm-host is another host", change: (s) => void (s.flags["--confirm-host"] = "example.com"), message: /not the host of IMPORT_TARGET_URL/ },
    { name: "--plan-sha is missing", change: (s) => void delete s.flags["--plan-sha"], message: /--plan-sha is required/ },
    { name: "--plan-sha is not the reviewed plan", change: (s) => void (s.flags["--plan-sha"] = "0".repeat(64)), message: /not the planSha256 of out\/plan\.json/ },
    {
        name: "plan.json was edited after `plan` wrote it",
        change: async (s) => {
            const edited = structuredClone(s.plan);
            edited.families[0].variants[0].priceTiers[0].unitPrice = 1;
            await writeFile(join(s.ctx.outDir, "plan.json"), JSON.stringify(edited));
        },
        message: /was changed after "plan" wrote it/,
    },
    {
        name: "plan.json was made for another backend",
        change: (s) => {
            const other = { ...planBody(s.plan), target: { ...s.plan.target, origin: "https://other.example", host: "other.example" } };
            return replacePlan(s, finalizePlan(other));
        },
        message: /was made for https:\/\/other\.example/,
    },
    { name: "plan.json does not exist", change: (s) => rm(join(s.ctx.outDir, "plan.json")), message: /run "plan" first/ },
    { name: "decisions.json does not exist", change: (s) => rm(s.ctx.decisionsPath), message: /2 family\(ies\) need an entry in decisions\.json[^]*lid\|ukp[^]*lid\|\|tim/ },
    {
        name: "decisions.json leaves one family undecided",
        change: (s) => writeFile(s.ctx.decisionsPath, JSON.stringify({ families: { "lid|ukp": { action: "skip" } } })),
        message: /1 family\(ies\) need an entry[^]*lid\|\|tim/,
    },
    { name: "decisions.json is not JSON", change: (s) => writeFile(s.ctx.decisionsPath, "{"), message: /decisions\.json is not valid JSON/ },
    {
        name: "a decision names a family that is not in the plan",
        change: (s) => writeFile(s.ctx.decisionsPath, JSON.stringify({ families: { ...DECISIONS.families, nope: { action: "skip" } } })),
        message: /"nope", which is not a family/,
    },
    {
        name: "a deferred family is marked for import",
        change: (s) => writeFile(s.ctx.decisionsPath, JSON.stringify({ families: { ...DECISIONS.families, "accessory|1": { action: "import" } } })),
        message: /is deferred and cannot be imported/,
    },
    {
        name: "a family without a category has no categoryId",
        change: (s) => writeFile(s.ctx.decisionsPath, JSON.stringify({ families: { ...DECISIONS.families, "lid||tim": { action: "import" } } })),
        message: /must set "categoryId"/,
    },
    {
        name: "a decision gives a categoryId to a family that has a category",
        change: (s) => writeFile(s.ctx.decisionsPath, JSON.stringify({ families: { ...DECISIONS.families, "lid|ukp": { action: "import", categoryId: 22 } } })),
        message: /remove "categoryId"/,
    },
    { name: "--only names an unknown family", change: (s) => void (s.flags["--only"] = "nope"), message: /--only "nope" is not a family/ },
    {
        name: "--only selects one family but another still needs a decision",
        change: async (s) => {
            s.flags["--only"] = "paper|a";
            await rm(s.ctx.decisionsPath);
        },
        message: /need an entry in decisions\.json/,
    },
    { name: "IMPORT_TARGET_URL is not set", change: (s) => void delete s.ctx.env.IMPORT_TARGET_URL, message: /IMPORT_TARGET_URL is required and has no default/ },
    { name: "IMPORT_API_TOKEN is not set", change: (s) => void delete s.ctx.env.IMPORT_API_TOKEN, message: /IMPORT_API_TOKEN is not set/ },
    { name: "IMPORT_API_TOKEN is pasted with a prefix", change: (s) => void (s.ctx.env.IMPORT_API_TOKEN = "Bearer abc.def.ghi"), message: /does not look like a JWT/ },
    {
        name: "an avatar image is missing",
        change: (s) => {
            s.ctx.readAvatar = async (id) => {
                if (id === 2002) throw new Error("data/images/2002.jpg is missing");
                return avatarBytes(id);
            };
        },
        message: /data\/images\/2002\.jpg is missing/,
    },
    { name: "--apply and --dry-run are both given", change: (s) => void (s.flags["--dry-run"] = true), message: /contradict/ },
];

for (const { name, change, message } of REFUSALS) {
    test(`apply refuses before any request or file when ${name}`, async () => {
        await withSetup(async (setup) => {
            await change(setup);
            const before = await readdir(setup.ctx.outDir);
            await assert.rejects(run(setup), message);
            assert.deepEqual(setup.fake.requests, [], "no request may be sent");
            assert.deepEqual(await readdir(setup.ctx.outDir), before, "nothing may be written");
        });
    });
}

test("without --apply it is a dry run: it explains what it would do and sends and writes nothing", async () => {
    await withSetup(async (setup) => {
        delete setup.flags["--apply"];
        delete setup.flags["--confirm-host"];
        await run(setup);
        assert.deepEqual(setup.fake.requests, []);
        assert.deepEqual(await readdir(setup.ctx.outDir), ["plan.json"]);
        const output = setup.logs.join("\n");
        assert.match(output, /Dry run: nothing is sent and nothing is written/);
        assert.match(output, /New categories: "Tô giấy" under #23/);
        for (const name of ["Ly giấy A", "Tô giấy B", "Nắp tim"]) assert.match(output, new RegExp(`create  ${name}`));
        assert.match(output, /skip    Nắp cầu \(decision: skip\)/);
        assert.match(output, /skip    Ống hút \(deferred\)/);
        assert.match(output, /--confirm-host is required/);
    });
});

test("the CLI wiring: apply is a subcommand, --help works, and a real run without a target refuses", () => {
    const env = { PATH: process.env.PATH ?? "" };
    const help = spawnSync(process.execPath, [CLI, "apply", "--help"], { env, encoding: "utf8" });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /Usage: .*apply \[options\]/);
    const listing = spawnSync(process.execPath, [CLI, "--help"], { env, encoding: "utf8" });
    assert.match(listing.stdout, /^ {2}apply /m);
    const refused = spawnSync(process.execPath, [CLI, "apply", "--apply"], { env, encoding: "utf8" });
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /refusing to apply, nothing was sent or written/);
    assert.match(refused.stderr, /IMPORT_TARGET_URL is required and has no default/);
});

// ---- Happy path and resume -----------------------------------------------------------------

test("applies the plan in order: the new category first, then one product per family with its avatar", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        await run(setup);

        assert.deepEqual(
            newProducts(fake).map((product) => product.name),
            ["Ly giấy A", "Tô giấy B", "Nắp cầu", "Nắp tim"],
            "skipped, deferred and look-alike families are not created",
        );
        const category = fake.categories.find((candidate) => candidate.name === "Tô giấy");
        assert.deepEqual(category, { id: BASELINE_MAX_CATEGORY_ID + 1, name: "Tô giấy", parentId: 23, isRoot: false });

        const [paper, bowl, lid, tim] = newProducts(fake);
        assert.equal(paper.categoryId, 31);
        assert.equal(bowl.categoryId, category?.id, "the bowl goes into the category created for it");
        assert.equal(lid.categoryId, 22);
        assert.equal(tim.categoryId, 22, "decisions.json supplied the category");
        assert.equal(paper.description, "Mô tả Ly giấy A");
        assert.deepEqual(
            paper.variants.map((v) => [v.capacityMl, v.diameterMm, v.priceTiers.map((t) => [t.minQuantity, t.unitPrice])]),
            [
                [270, 80, [[1, 810]]],
                [360, 90, [[1, 910]]],
            ],
        );
        assert.deepEqual(paper.avatar, { fileName: "2001.jpg", type: "image/jpeg", bytes: avatarBytes(2001) });
        assert.deepEqual(bowl.avatar?.bytes, avatarBytes(2002));

        for (const request of fake.requests) {
            const expected = request.method === "GET" ? null : `Bearer ${fake.token}`;
            assert.equal(request.authorization, expected, `${request.method} ${request.path}`);
        }
        assert.equal(fake.requests[0].path, "/health");
        assert.ok(setup.baselineAtWrite.length > 0 && setup.baselineAtWrite.every(Boolean), "baseline.json exists before the first write");
        assert.match(setup.logs.join("\n"), /Done: 4 created, 0 adopted, 0 already done, 2 skipped, 0 failed/);
    });
});

test("baseline.json and manifest.json record what a rollback needs", async () => {
    await withSetup(async (setup) => {
        await run(setup);
        const baseline = JSON.parse(await readFile(join(setup.ctx.outDir, "baseline.json"), "utf8")) as { products: Array<{ id: number }>; categories: unknown[] };
        assert.deepEqual(baseline.products.map((product) => product.id).sort(), [70, 75, 76]);
        assert.equal(baseline.categories.length, 10);

        const manifest = await readManifest(setup);
        assert.equal(manifest.planSha256, setup.plan.planSha256);
        assert.equal(manifest.target.host, setup.fake.host);
        assert.deepEqual(manifest.baseline, { maxProductId: BASELINE_MAX_PRODUCT_ID, maxCategoryId: BASELINE_MAX_CATEGORY_ID });
        assert.deepEqual(manifest.categories, [{ name: "Tô giấy", parentId: 23, id: 34, state: "created", error: null }]);
        assert.deepEqual(
            manifest.products.map((product) => [product.familyKey, product.id, product.state, product.categoryId]),
            [
                ["paper|a", 77, "created", 31],
                ["bowl|b", 78, "created", 34],
                ["lid|mvp", 79, "created", 22],
                ["lid||tim", 80, "created", 22],
            ],
        );
        const [paper] = manifest.products;
        assert.equal(paper.avatar.url, "https://res.cloudinary.test/products/77.jpg");
        assert.equal(paper.avatar.oldProductId, 2001);
        assert.match(paper.avatar.sha256, /^[0-9a-f]{64}$/);
        assert.deepEqual(
            paper.variants.map((v) => [v.source.oldProductId, v.source.oldVariationId, v.capacityMl, v.diameterMm]),
            [
                [2001, 2002, 270, 80],
                [2001, 2002, 360, 90],
            ],
        );
        assert.ok(paper.variants.every((v) => typeof v.id === "number"), "the new variant ids are kept");
    });
});

test("the journal announces every write before its result", async () => {
    await withSetup(async (setup) => {
        await run(setup);
        const events = (await readJournal(setup)).map((entry) => `${entry.event}${entry.kind ? `:${entry.kind}:${entry.key}` : ""}${entry.outcome ? `=${entry.outcome}` : ""}`);
        assert.deepEqual(events, [
            "run",
            "intent:product:paper|a",
            "result:product:paper|a=created",
            "intent:category:23/Tô giấy",
            "result:category:23/Tô giấy=created",
            "intent:product:bowl|b",
            "result:product:bowl|b=created",
            "intent:product:lid|mvp",
            "result:product:lid|mvp=created",
            "intent:product:lid||tim",
            "result:product:lid||tim=created",
        ]);
    });
});

test("decisions steer the run: skip a create family, import an overlap family", async () => {
    const decisions = { families: { "paper|a": { action: "skip" }, "lid|ukp": { action: "import" }, "lid||tim": { action: "skip" } } };
    await withSetup(
        async (setup) => {
            await run(setup);
            assert.deepEqual(newProducts(setup.fake).map((product) => [product.name, product.categoryId]), [
                ["Tô giấy B", 34],
                ["Nắp cầu", 22],
                ["Nắp cầu", 21],
            ]);
        },
        { decisions },
    );
});

test("--only applies the canary family alone (and not the category it does not need); a full run then resumes", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        setup.flags["--only"] = "lid|mvp";
        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Nắp cầu"]);
        assert.equal(fake.categories.length, 10, "the new category is only created for a family that needs it");
        assert.equal((await readManifest(setup)).products.length, 1);

        delete setup.flags["--only"];
        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Nắp cầu", "Ly giấy A", "Tô giấy B", "Nắp tim"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 4, "the canary family was not posted again");
        assert.equal(posts(fake, "/api/v1/Categories").length, 1);
    });
});

test("running it again changes nothing", async () => {
    await withSetup(async (setup) => {
        await run(setup);
        const before = { writes: writes(setup.fake).length, products: JSON.stringify(setup.fake.products) };
        setup.logs.length = 0;
        await run(setup);
        assert.equal(writes(setup.fake).length, before.writes);
        assert.equal(JSON.stringify(setup.fake.products), before.products);
        assert.match(setup.logs.join("\n"), /Done: 0 created, 0 adopted, 4 already done/);
    });
});

class Crash extends Error {}

test("resumes after a crash: the product the lost run created is adopted, never posted twice", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        // The importer dies right after the backend created "Tô giấy B": before it could record the id.
        const crashing = setup.ctx;
        crashing.wrapClient = (client: Backend): Backend => ({
            ...client,
            createProduct: async (input) => {
                const created = await client.createProduct(input);
                if (input.name === "Tô giấy B") throw new Crash("simulated crash");
                return created;
            },
        });
        await assert.rejects(run(setup), Crash);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B"]);
        const interrupted = await readManifest(setup);
        assert.deepEqual(
            interrupted.products.map((product) => [product.familyKey, product.state, product.id]),
            [
                ["paper|a", "created", 77],
                ["bowl|b", "pending", null],
            ],
        );
        assert.equal((await readJournal(setup)).at(-1)?.event, "stop");

        delete crashing.wrapClient;
        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B", "Nắp cầu", "Nắp tim"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 4, "no product was posted twice");
        assert.equal(posts(fake, "/api/v1/Categories").length, 1);
        const resumed = await readManifest(setup);
        assert.deepEqual(
            resumed.products.map((product) => [product.familyKey, product.state, product.id]),
            [
                ["paper|a", "created", 77],
                ["bowl|b", "adopted", 78],
                ["lid|mvp", "created", 79],
                ["lid||tim", "created", 80],
            ],
        );
        assert.equal(resumed.products[1].avatar.url, "https://res.cloudinary.test/products/78.jpg");
    });
});

test("resumes after a crash that lost a new category: it is adopted, so it exists once", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        setup.ctx.wrapClient = (client: Backend): Backend => ({
            ...client,
            createCategory: async (input) => {
                await client.createCategory(input);
                throw new Crash("simulated crash");
            },
        });
        await assert.rejects(run(setup), Crash);
        assert.deepEqual((await readManifest(setup)).categories.map((category) => [category.state, category.id]), [["pending", null]]);

        delete setup.ctx.wrapClient;
        await run(setup);
        assert.equal(fake.categories.filter((category) => category.name === "Tô giấy").length, 1);
        assert.equal(posts(fake, "/api/v1/Categories").length, 1);
        const manifest = await readManifest(setup);
        assert.deepEqual(manifest.categories.map((category) => [category.state, category.id]), [["adopted", 34]]);
        assert.equal(newProducts(fake).find((product) => product.name === "Tô giấy B")?.categoryId, 34);
    });
});

test("--only warns about earlier writes it leaves unsettled", async () => {
    await withSetup(async (setup) => {
        setup.ctx.wrapClient = (client: Backend): Backend => ({
            ...client,
            createProduct: async (input) => {
                const created = await client.createProduct(input);
                if (input.name === "Tô giấy B") throw new Crash("simulated crash");
                return created;
            },
        });
        await assert.rejects(run(setup), Crash);

        delete setup.ctx.wrapClient;
        setup.flags["--only"] = "lid|mvp";
        await run(setup);
        assert.match(setup.logs.join("\n"), /Warning: "Tô giấy B" is still unsettled in out\/manifest\.json/);
        const states = (await readManifest(setup)).products.map((product) => [product.familyKey, product.state]);
        assert.deepEqual(states, [["paper|a", "created"], ["bowl|b", "pending"], ["lid|mvp", "created"]]);
    });
});

// ---- Failure handling ----------------------------------------------------------------------

test("a 500 after the backend stored the product adopts it instead of posting again", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        fake.fail({ name: "Nắp cầu", status: 500, sideEffect: true });
        await run(setup);
        // Product 70 has the same name, category and sizes but sits below the baseline: it is not ours.
        assert.deepEqual(newProducts(fake).map((product) => product.id), [77, 78, 79, 80]);
        assert.equal(posts(fake, "/api/v1/Products").length, 4);
        const lid = (await readManifest(setup)).products.find((product) => product.familyKey === "lid|mvp");
        assert.deepEqual([lid?.state, lid?.id], ["adopted", 79]);
        const steps = (await readJournal(setup)).filter((entry) => entry.key === "lid|mvp").map((entry) => `${entry.event}${entry.outcome ? `=${entry.outcome}` : ""}`);
        assert.deepEqual(steps, ["intent", "result=unknown", "result=adopted"]);
    });
});

test("a 500 that stored nothing is retried once, after looking, and creates the product once", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        fake.fail({ name: "Nắp cầu", status: 500 });
        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B", "Nắp cầu", "Nắp tim"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 5, "one failed attempt plus one retry");
        const keys = fake.requests.map((request) => `${request.method} ${request.path.split("?")[0]}`);
        const productPosts = keys.flatMap((key, index) => (key === "POST /api/v1/Products" ? [index] : []));
        assert.equal(keys[productPosts[2] + 1], "GET /api/v1/Products", "the failed POST is followed by a look at the backend, then the retry");
        assert.equal(productPosts[3], productPosts[2] + 2);
        assert.equal((await readManifest(setup)).products[2].state, "created");
    });
});

test("timeouts: the product a timed-out POST created is adopted, one that created nothing is retried", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        setup.ctx.timing.writeTimeoutMs = 300;
        fake.fail({ name: "Ly giấy A", hang: true, sideEffect: true });
        fake.fail({ name: "Tô giấy B", hang: true });
        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B", "Nắp cầu", "Nắp tim"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 5, "only the bowl was posted twice");
        assert.deepEqual(
            (await readManifest(setup)).products.map((product) => product.state),
            ["adopted", "created", "created", "created"],
        );
    });
});

test("a 400 is final: that family fails without a retry, the run goes on, and the next run retries it", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        fake.fail({ name: "Nắp cầu", status: 400, body: "Category is not allowed" });
        await assert.rejects(run(setup), /1 family\(ies\) failed/);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B", "Nắp tim"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 4, "a rejected write is not repeated");
        const lid = (await readManifest(setup)).products.find((product) => product.familyKey === "lid|mvp");
        assert.equal(lid?.state, "failed");
        assert.match(lid?.error ?? "", /HTTP 400: Category is not allowed/);
        assert.match(setup.logs.join("\n"), /\[3\/4\] Nắp cầu: FAILED/);

        await run(setup);
        assert.deepEqual(newProducts(fake).map((product) => product.name), ["Ly giấy A", "Tô giấy B", "Nắp tim", "Nắp cầu"]);
        assert.equal(posts(fake, "/api/v1/Products").length, 5, "only the failed family was posted again");
    });
});

test("it stops after 3 consecutive failed writes", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        fake.fail({ method: "POST", status: 500, times: 100 });
        await assert.rejects(run(setup), /stopping after 3 consecutive failed writes/);
        assert.equal(writes(fake).length, 3, "two attempts for the first family, then the category write stops the run");
        assert.equal((await readJournal(setup)).at(-1)?.event, "stop");
        assert.equal(fake.products.length, 3);
    });
});

test("a rejected token stops the run at once with a clear message, and the run stays resumable", async () => {
    await withSetup(async (setup) => {
        setup.fake.expireToken();
        await assert.rejects(run(setup), /HTTP 401[^]*expired or not an admin token[^]*IMPORT_API_TOKEN/);
        assert.equal(writes(setup.fake).length, 1, "no further write after the 401");
        assert.deepEqual((await readManifest(setup)).products.map((product) => [product.familyKey, product.state]), [["paper|a", "pending"]]);
        assert.equal(setup.fake.products.length, 3);
    });
});

test("production changing after the plan was made is refused before the first write", async () => {
    await withSetup(async (setup) => {
        setup.fake.products.push(fakeProduct(77, "Thêm bởi người khác", 30));
        await assert.rejects(run(setup), /changed since the plan was made[^]*run "plan" again/);
        assert.deepEqual(writes(setup.fake), []);
        assert.ok(!(await readdir(setup.ctx.outDir)).includes("baseline.json"), "no baseline is kept for a stale plan");
    });
});

test("a category chosen in decisions.json must exist and must not be a root, checked before the first write", async () => {
    for (const [categoryId, message] of [
        [99, /category #99 does not exist/],
        [20, /category #20 is a root category/],
    ] as const) {
        const decisions = { families: { ...DECISIONS.families, "lid||tim": { action: "import", categoryId } } };
        await withSetup(
            async (setup) => {
                await assert.rejects(run(setup), message);
                assert.deepEqual(writes(setup.fake), []);
                assert.ok(!(await readdir(setup.ctx.outDir)).includes("baseline.json"));
            },
            { decisions },
        );
    }
});

test("a manifest from another plan is refused", async () => {
    await withSetup(async (setup) => {
        setup.flags["--only"] = "paper|a";
        await run(setup);
        const changed = finalizePlan({ ...planBody(setup.plan), categoriesToCreate: [] });
        await replacePlan(setup, changed);
        const writesBefore = writes(setup.fake).length;
        await assert.rejects(run(setup), /out\/manifest\.json belongs to plan/);
        assert.equal(writes(setup.fake).length, writesBefore);
    });
});

test("the token never reaches a written file, a log line or an error, even when the server echoes it", async () => {
    await withSetup(async (setup) => {
        const { fake } = setup;
        fake.fail({ name: "Nắp cầu", status: 400, body: `bad credentials ${fake.token}` });
        fake.fail({ name: "Tô giấy B", status: 500, body: `oops ${fake.token}`, times: 2 });
        const error = await run(setup).then(
            () => null,
            (caught: unknown) => caught,
        );
        assert.match(String((error as Error).message), /failed/);
        const seen = [String((error as Error).message), ...setup.logs];
        for (const name of await readdir(setup.ctx.outDir)) seen.push(await readFile(join(setup.ctx.outDir, name), "utf8"));
        assert.ok(seen.length > 4);
        for (const text of seen) assert.ok(!text.includes(fake.token), "the token leaked");
        assert.match(await readFile(join(setup.ctx.outDir, "journal.jsonl"), "utf8"), /\[redacted\]/);
    });
});

// ---- Client --------------------------------------------------------------------------------

test("the client pages through everything, 100 at a time, with no credentials on reads", async () => {
    const many = Array.from({ length: 130 }, (_, index) => fakeProduct(index + 1, `Sản phẩm ${index + 1}`, 30));
    const fake = await startFakeBackend({ products: many });
    try {
        const client = createBackend(new URL(fake.origin), fake.token, { gapMs: 0 });
        await client.health();
        assert.equal((await client.listProducts()).length, 130);
        assert.equal((await client.listCategories()).length, 10);
        assert.deepEqual(
            fake.requests.map((request) => `${request.method} ${request.path} ${request.authorization}`),
            [
                "GET /health null",
                "GET /api/v1/Products?page=1&pageSize=100 null",
                "GET /api/v1/Products?page=2&pageSize=100 null",
                "GET /api/v1/Categories?page=1&pageSize=100 null",
            ],
        );
    } finally {
        await fake.close();
    }
});

test("the client tells a rejected write from an unknown one, and a bad token from both", async () => {
    const fake = await startFakeBackend();
    try {
        const client = createBackend(new URL(fake.origin), fake.token, { gapMs: 0, writeTimeoutMs: 200 });
        fake.fail({ name: "x", status: 400 });
        fake.fail({ name: "y", status: 502 });
        fake.fail({ name: "z", hang: true });
        const outcome = async (name: string) => {
            try {
                await client.createCategory({ name, parentId: 20 });
                return "ok";
            } catch (error) {
                assert.ok(error instanceof BackendError);
                return `${error.status}/${error.outcomeUnknown}`;
            }
        };
        assert.equal(await outcome("x"), "400/false");
        assert.equal(await outcome("y"), "502/true");
        assert.equal(await outcome("z"), "null/true");
        assert.equal(await outcome("fine"), "ok");

        const stranger = createBackend(new URL(fake.origin), "another.token.value", { gapMs: 0 });
        await assert.rejects(stranger.createCategory({ name: "w", parentId: 20 }), (error: unknown) => error instanceof AuthError && error.status === 401);
        const reader = createBackend(new URL(fake.origin), null, { gapMs: 0 });
        await assert.rejects(reader.deleteProduct(1), /needs the API token/);
        assert.equal((await reader.listCategories()).length, 11);
    } finally {
        await fake.close();
    }
});

test("the client deletes by id (for rollback) and reports a missing id as a plain 404", async () => {
    const fake = await startFakeBackend({ products: [fakeProduct(5, "Cũ", 30)] });
    try {
        const client = createBackend(new URL(fake.origin), fake.token, { gapMs: 0 });
        const category = await client.createCategory({ name: "Tạm", parentId: 20 });
        await client.deleteCategory(category.id);
        await client.deleteProduct(5);
        assert.deepEqual(fake.products, []);
        assert.ok(!fake.categories.some((candidate) => candidate.id === category.id));
        for (const gone of [client.deleteProduct(5), client.deleteCategory(category.id)]) {
            await assert.rejects(gone, (error: unknown) => error instanceof BackendError && error.status === 404 && !error.outcomeUnknown);
        }
        await assert.rejects(client.deleteCategory(20), /root categories cannot be deleted/i);
    } finally {
        await fake.close();
    }
});
