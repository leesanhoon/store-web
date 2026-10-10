import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

// In-process stand-in for the store backend, for tests only. It follows the contract in
// audits/C-new-import-surface.md: ids only ever grow, product names are NOT unique (as in the real
// backend), writes need `Authorization: Bearer <token>`, products are posted as multipart with the
// `Variants[i].PriceTiers[j].*` field names and the same validation, lists are paged with a default
// page size of 10 (capped at 100) and sorted by id descending. Faults let a test make a write answer
// 500, 400 or nothing at all (a timeout), with or without the write having taken effect first.

export type FakeTier = { id: number; minQuantity: number; unitPrice: number };
export type FakeVariant = { id: number; capacityMl: number; diameterMm: number; priceTiers: FakeTier[] };
export type FakeProduct = {
    id: number;
    name: string;
    description: string | null;
    categoryId: number;
    avatarImageUrl: string | null;
    /** The multipart `AvatarImage` file as the server received it. */
    avatar: { fileName: string; type: string; bytes: Buffer } | null;
    variants: FakeVariant[];
};
export type FakeCategory = { id: number; name: string; parentId: number | null; isRoot: boolean };

export type FakeRequest = { method: string; path: string; authorization: string | null };

export type Fault = {
    /** Only this method; any write when omitted. */
    method?: "POST" | "DELETE";
    /** Only the product or category with this name; any when omitted. */
    name?: string;
    /** Carry the write out first, then fail: the "500 with a side effect" case. */
    sideEffect?: boolean;
    /** How many matching writes to fail; defaults to 1. */
    times?: number;
    /** Body of the error response. */
    body?: string;
} & ({ status: number } | { hang: true });

export type FakeOptions = {
    token?: string;
    categories?: FakeCategory[];
    products?: FakeProduct[];
    /** Called before every write is handled. */
    onWrite?: (method: string, path: string) => void;
};

export type FakeBackend = {
    /** `http://127.0.0.1:<port>` */
    origin: string;
    /** `127.0.0.1:<port>`, what `--confirm-host` must say. */
    host: string;
    token: string;
    requests: FakeRequest[];
    products: FakeProduct[];
    categories: FakeCategory[];
    fail(fault: Fault): void;
    /** From now on every write answers 401, as after the token expired. */
    expireToken(): void;
    close(): Promise<void>;
};

const PRODUCTS = "/api/v1/products";
const CATEGORIES = "/api/v1/categories";

export const DEFAULT_CATEGORIES: FakeCategory[] = [
    { id: 20, name: "Nắp", parentId: null, isRoot: true },
    { id: 21, name: "Nắp UKP", parentId: 20, isRoot: false },
    { id: 22, name: "Nắp MVP-VP", parentId: 20, isRoot: false },
    { id: 23, name: "Ly giấy", parentId: null, isRoot: true },
    { id: 24, name: "Ly nhựa", parentId: null, isRoot: true },
    { id: 29, name: "Ly Pet", parentId: 24, isRoot: false },
    { id: 30, name: "Ly PP", parentId: 24, isRoot: false },
    { id: 31, name: "Ly giấy 1 lớp", parentId: 23, isRoot: false },
    { id: 32, name: "Ly giấy 2 lớp", parentId: 23, isRoot: false },
    { id: 33, name: "Ly in offset", parentId: 23, isRoot: false },
];

/** A product that already lives on the fake backend; each `[capacityMl, diameterMm]` becomes a variant with one tier. */
export function fakeProduct(id: number, name: string, categoryId: number, sizes: Array<[number, number]> = [[500, 95]]): FakeProduct {
    return {
        id,
        name,
        description: null,
        categoryId,
        avatarImageUrl: `https://res.cloudinary.test/products/${id}.jpg`,
        avatar: null,
        variants: sizes.map(([capacityMl, diameterMm], index) => ({
            id: id * 100 + index,
            capacityMl,
            diameterMm,
            priceTiers: [{ id: id * 100 + index, minQuantity: 1000, unitPrice: 700 }],
        })),
    };
}

type Outcome = { status: number; body?: unknown };
type ActiveFault = Fault & { remaining: number };

const rejected = (message: string): Outcome => ({ status: 400, body: { title: message } });

function readWhole(request: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks)));
        request.on("error", reject);
    });
}

function send(response: ServerResponse, outcome: Outcome) {
    if (outcome.body === undefined) {
        response.writeHead(outcome.status).end();
        return;
    }
    const text = typeof outcome.body === "string";
    response.writeHead(outcome.status, { "content-type": text ? "text/plain" : "application/json" });
    response.end(text ? (outcome.body as string) : JSON.stringify(outcome.body));
}

function paged<T>(items: T[], params: URLSearchParams) {
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 10));
    return { items: items.slice((page - 1) * pageSize, page * pageSize), totalCount: items.length, page, pageSize };
}

function whole(form: FormData, field: string): number | null {
    const raw = form.get(field);
    return typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : null;
}

export async function startFakeBackend(options: FakeOptions = {}): Promise<FakeBackend> {
    const token = options.token ?? "fake.jwt-token";
    const products = [...(options.products ?? [])];
    const categories = [...(options.categories ?? DEFAULT_CATEGORIES)];
    const requests: FakeRequest[] = [];
    const faults: ActiveFault[] = [];
    let expired = false;
    let nextProductId = Math.max(0, ...products.map((product) => product.id)) + 1;
    let nextCategoryId = Math.max(0, ...categories.map((category) => category.id)) + 1;
    let nextChildId = 1_000_000;

    const productBody = (product: FakeProduct) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        categoryName: categories.find((category) => category.id === product.categoryId)?.name ?? "",
        avatarImageUrl: product.avatarImageUrl,
        galleryImages: [],
        variants: product.variants.map((variant) => ({ ...variant, sizeName: null })),
        lids: [],
    });
    const categoryBody = (category: FakeCategory) => ({ ...category, description: "" });

    function addCategory(input: unknown): Outcome {
        const { name, parentId = null } = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
        if (typeof name !== "string" || name.trim() === "" || name.length > 150) return rejected("Name is required (max 150)");
        if (parentId !== null && !categories.some((category) => category.id === parentId)) return rejected("Parent not found");
        if (categories.some((category) => category.name === name && category.parentId === parentId)) {
            return rejected("A category with this name already exists under this parent");
        }
        const category: FakeCategory = { id: nextCategoryId++, name, parentId: parentId as number | null, isRoot: false };
        categories.push(category);
        return { status: 201, body: categoryBody(category) };
    }

    function addProduct(form: FormData, avatar: FakeProduct["avatar"]): Outcome {
        const name = form.get("Name");
        if (typeof name !== "string" || name.trim() === "" || name.length > 200) return rejected("Name is required (max 200)");
        const description = form.get("Description");
        if (typeof description === "string" && description.length > 1000) return rejected("Description is longer than 1000");
        const categoryId = whole(form, "CategoryId");
        if (categoryId === null || !categories.some((category) => category.id === categoryId)) return rejected("Category not found");

        const variants: FakeVariant[] = [];
        for (let i = 0; form.has(`Variants[${i}].CapacityMl`); i++) {
            const capacityMl = whole(form, `Variants[${i}].CapacityMl`);
            const diameterMm = whole(form, `Variants[${i}].DiameterMm`);
            if (capacityMl === null || diameterMm === null) return rejected(`Variants[${i}] needs CapacityMl and DiameterMm`);
            if (variants.some((v) => v.capacityMl === capacityMl && v.diameterMm === diameterMm)) {
                return rejected("Duplicate capacity and diameter");
            }
            const priceTiers: FakeTier[] = [];
            for (let j = 0; form.has(`Variants[${i}].PriceTiers[${j}].MinQuantity`); j++) {
                const minQuantity = whole(form, `Variants[${i}].PriceTiers[${j}].MinQuantity`);
                const price = form.get(`Variants[${i}].PriceTiers[${j}].UnitPrice`);
                const unitPrice = typeof price === "string" && /^\d+(\.\d+)?$/.test(price) ? Number(price) : null;
                if (minQuantity === null || unitPrice === null) return rejected("A price tier needs MinQuantity and UnitPrice");
                if (priceTiers.some((tier) => tier.minQuantity === minQuantity)) return rejected("Duplicate MinQuantity");
                priceTiers.push({ id: nextChildId++, minQuantity, unitPrice });
            }
            if (priceTiers.length === 0) return rejected("Every variant needs at least one price tier");
            variants.push({ id: nextChildId++, capacityMl, diameterMm, priceTiers });
        }
        if (variants.length === 0) return rejected("At least one variant is required");

        const id = nextProductId++;
        const product: FakeProduct = {
            id,
            name,
            description: typeof description === "string" ? description : null,
            categoryId,
            avatarImageUrl: avatar ? `https://res.cloudinary.test/products/${id}.jpg` : null,
            avatar,
            variants,
        };
        products.push(product);
        return { status: 201, body: productBody(product) };
    }

    function remove(kind: string, id: number): Outcome {
        if (kind === "products") {
            const index = products.findIndex((product) => product.id === id);
            if (index < 0) return { status: 404 };
            products.splice(index, 1);
            return { status: 204 };
        }
        const category = categories.find((candidate) => candidate.id === id);
        if (!category) return { status: 404 };
        if (category.isRoot) return rejected("Root categories cannot be deleted");
        if (categories.some((other) => other.parentId === id) || products.some((product) => product.categoryId === id)) {
            return rejected("The category still has children or products");
        }
        categories.splice(categories.indexOf(category), 1);
        return { status: 204 };
    }

    function takeFault(method: string, name: string | null): ActiveFault | undefined {
        const fault = faults.find(
            (candidate) =>
                candidate.remaining > 0 &&
                (candidate.method === undefined || candidate.method === method) &&
                (candidate.name === undefined || candidate.name === name),
        );
        if (fault) fault.remaining--;
        return fault;
    }

    function read(response: ServerResponse, path: string, params: URLSearchParams) {
        if (path === "/health") return send(response, { status: 200, body: "Healthy" });
        if (path === PRODUCTS) {
            const newestFirst = [...products].sort((a, b) => b.id - a.id).map(productBody);
            return send(response, { status: 200, body: paged(newestFirst, params) });
        }
        if (path === CATEGORIES) {
            const byName = [...categories].sort((a, b) => a.name.localeCompare(b.name)).map(categoryBody);
            return send(response, { status: 200, body: paged(byName, params) });
        }
        return send(response, { status: 404 });
    }

    async function write(request: IncomingMessage, response: ServerResponse, method: string, path: string) {
        options.onWrite?.(method, path);
        const body = await readWhole(request);
        let name: string | null = null;
        let perform: () => Outcome;
        const target = /^\/api\/v1\/(products|categories)\/(\d+)$/.exec(path);
        if (method === "POST" && path === CATEGORIES) {
            const input: unknown = JSON.parse(body.toString("utf8"));
            name = typeof (input as { name?: unknown })?.name === "string" ? (input as { name: string }).name : null;
            perform = () => addCategory(input);
        } else if (method === "POST" && path === PRODUCTS) {
            const form = await new Response(body, { headers: { "content-type": request.headers["content-type"] ?? "" } }).formData();
            const file = form.get("AvatarImage");
            const avatar =
                file instanceof File ? { fileName: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) } : null;
            const given = form.get("Name");
            name = typeof given === "string" ? given : null;
            perform = () => addProduct(form, avatar);
        } else if (method === "DELETE" && target) {
            const id = Number(target[2]);
            const pool: Array<{ id: number; name: string }> = target[1] === "products" ? products : categories;
            name = pool.find((entry) => entry.id === id)?.name ?? null;
            perform = () => remove(target[1], id);
        } else {
            return send(response, { status: 404 });
        }

        if (expired || request.headers.authorization !== `Bearer ${token}`) return send(response, { status: 401, body: "Unauthorized" });
        const fault = takeFault(method, name);
        if (!fault) return send(response, perform());
        if (fault.sideEffect) perform();
        // Without an answer the client waits until its own timeout.
        if ("hang" in fault) return;
        return send(response, { status: fault.status, body: fault.body ?? "Injected fault" });
    }

    const server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://fake.local");
        const method = request.method ?? "GET";
        requests.push({ method, path: `${url.pathname}${url.search}`, authorization: request.headers.authorization ?? null });
        const path = url.pathname.toLowerCase().replace(/\/$/, "");
        const done = method === "GET" ? Promise.resolve(read(response, path, url.searchParams)) : write(request, response, method, path);
        done.catch(() => {
            if (!response.headersSent) send(response, { status: 500, body: "Fake backend crashed" });
        });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const host = `127.0.0.1:${(server.address() as AddressInfo).port}`;

    return {
        origin: `http://${host}`,
        host,
        token,
        requests,
        products,
        categories,
        fail: (fault) => void faults.push({ ...fault, remaining: fault.times ?? 1 }),
        expireToken: () => void (expired = true),
        close: () =>
            new Promise<void>((resolve) => {
                server.closeAllConnections();
                server.close(() => resolve());
            }),
    };
}
