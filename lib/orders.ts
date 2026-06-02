import { CartItem, QuoteRequest, getQuoteRequests } from "@/lib/cart";

export type OrderStatus =
    | "new"
    | "quoted"
    | "deposit_pending"
    | "designing"
    | "mockup_pending"
    | "production"
    | "shipping"
    | "completed"
    | "cancelled";

export type OrderRecord = {
    id: string;
    createdAt: string;
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
    items: CartItem[];
    status: OrderStatus;
    internalNote: string;
    mockupFileName: string;
};

export const ORDER_STORAGE_KEY = "dtp_orders";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    new: "Mới tạo",
    quoted: "Đã báo giá",
    deposit_pending: "Chờ cọc",
    designing: "Đang thiết kế",
    mockup_pending: "Chờ duyệt mẫu",
    production: "Đang sản xuất",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
    "new",
    "quoted",
    "deposit_pending",
    "designing",
    "mockup_pending",
    "production",
    "shipping",
    "completed",
];

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

export function getOrders() {
    return readJson<OrderRecord[]>(ORDER_STORAGE_KEY, []);
}

export function saveOrders(orders: OrderRecord[]) {
    writeJson(ORDER_STORAGE_KEY, orders);
}

function quoteToOrder(quote: QuoteRequest): OrderRecord {
    return {
        id: quote.id,
        createdAt: quote.createdAt,
        fullName: quote.fullName,
        phone: quote.phone,
        businessName: quote.businessName,
        note: quote.note,
        items: quote.items,
        status: quote.status === "quote_requested" ? "quoted" : "new",
        internalNote: "",
        mockupFileName: "",
    };
}

export function syncOrdersFromQuotes() {
    const existingOrders = getOrders();
    const quotes = getQuoteRequests();
    const merged = new Map<string, OrderRecord>();

    existingOrders.forEach((order) => merged.set(order.id, order));
    quotes.forEach((quote) => {
        if (!merged.has(quote.id)) {
            merged.set(quote.id, quoteToOrder(quote));
        }
    });

    const result = Array.from(merged.values()).sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
    );

    saveOrders(result);
    return result;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
    const orders = getOrders().map((order) => (order.id === orderId ? { ...order, status } : order));
    saveOrders(orders);
    return orders;
}

export function updateOrderMeta(
    orderId: string,
    payload: Partial<Pick<OrderRecord, "internalNote" | "mockupFileName">>,
) {
    const orders = getOrders().map((order) => (order.id === orderId ? { ...order, ...payload } : order));
    saveOrders(orders);
    return orders;
}

export function findOrdersByPhone(phone: string) {
    const normalized = phone.trim();
    if (!normalized) return [];

    return getOrders().filter((order) => order.phone.includes(normalized));
}

export function findOrderByIdAndPhone(orderId: string, phone: string) {
    return getOrders().find(
        (order) => order.id.toLowerCase() === orderId.trim().toLowerCase() && order.phone.includes(phone.trim()),
    ) ?? null;
}
