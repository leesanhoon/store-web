export type CartUnit = "cay" | "thung";

export type CartItem = {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    unit: CartUnit;
    categoryName: string;
};

export type QuoteRequest = {
    id: string;
    createdAt: string;
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
    items: CartItem[];
    status: "new" | "quote_requested";
};

const CART_KEY = "dtp_cart_items";
const QUOTE_KEY = "dtp_quote_requests";

function readJson<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") {
        return fallback;
    }

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson<T>(key: string, value: T) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCartItems() {
    return readJson<CartItem[]>(CART_KEY, []);
}

export function saveCartItems(items: CartItem[]) {
    writeJson(CART_KEY, items);
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
    const items = getCartItems();
    const quantity = item.quantity ?? 1;
    const existingIndex = items.findIndex(
        (current) => current.productId === item.productId && current.unit === item.unit,
    );

    if (existingIndex >= 0) {
        items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + quantity,
        };
    } else {
        items.push({ ...item, quantity });
    }

    saveCartItems(items);
    return items;
}

export function updateCartItemQuantity(productId: number, unit: CartUnit, quantity: number) {
    const items = getCartItems()
        .map((item) =>
            item.productId === productId && item.unit === unit
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
        )
        .filter((item) => item.quantity > 0);

    saveCartItems(items);
    return items;
}

export function removeCartItem(productId: number, unit: CartUnit) {
    const items = getCartItems().filter(
        (item) => !(item.productId === productId && item.unit === unit),
    );
    saveCartItems(items);
    return items;
}

export function clearCart() {
    saveCartItems([]);
}

export function getQuoteRequests() {
    return readJson<QuoteRequest[]>(QUOTE_KEY, []);
}

export function saveQuoteRequests(requests: QuoteRequest[]) {
    writeJson(QUOTE_KEY, requests);
}

export function createQuoteRequest(payload: Omit<QuoteRequest, "id" | "createdAt" | "status">) {
    const request: QuoteRequest = {
        ...payload,
        id: `RQ-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "new",
    };

    const requests = [request, ...getQuoteRequests()];
    saveQuoteRequests(requests);
    return request;
}

export function formatUnit(unit: CartUnit) {
    return unit === "thung" ? "Thùng" : "Cây";
}
