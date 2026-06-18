import { apiClient, type PaginatedResponse } from "@/lib/api/http";

export type OrderStatus = "PendingConfirmation" | "Confirmed" | "Shipping" | "Completed" | "Cancelled";

const STATUS_LOOKUP: Record<string, OrderStatus> = Object.fromEntries(
    (["PendingConfirmation", "Confirmed", "Shipping", "Completed", "Cancelled"] as const).map(
        (s) => [s.toLowerCase(), s],
    ),
);

export function normalizeOrderStatus(raw: string): OrderStatus {
    return STATUS_LOOKUP[raw.toLowerCase()] ?? "PendingConfirmation";
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PendingConfirmation: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Shipping: "Đang giao",
    Completed: "Hoàn tất",
    Cancelled: "Đã hủy",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PendingConfirmation: ["Confirmed", "Cancelled"],
    Confirmed: ["Shipping"],
    Shipping: ["Completed"],
    Completed: [],
    Cancelled: [],
};

export type OrderItemDto = {
    productId: number;
    productName: string;
    materialId: number | null;
    materialName: string | null;
    printTypeId: number | null;
    printTypeName: string | null;
    lidId: number | null;
    lidName: string | null;
    quantity: number;
    unitPrice: number;
};

export type OrderDetailDto = {
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    note: string | null;
    totalAmount: number;
    status: OrderStatus;
    createdAtUtc: string;
    items: OrderItemDto[];
};

export type OrderSummaryDto = {
    id: number;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
    createdAtUtc: string;
};

export type CreateOrderRequest = {
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    note?: string | null;
    items: CreateOrderItemRequest[];
};

export type CreateOrderItemRequest = {
    productId: number;
    quantity: number;
    unitPrice: number;
    materialId?: number | null;
    printTypeId?: number | null;
    lidId?: number | null;
};

export type UpdateOrderStatusRequest = {
    status: OrderStatus;
};

function normalizeDetailStatus(dto: OrderDetailDto): OrderDetailDto {
    return { ...dto, status: normalizeOrderStatus(dto.status) };
}

export async function createOrder(payload: CreateOrderRequest): Promise<OrderDetailDto> {
    const result = await apiClient.post<OrderDetailDto, CreateOrderRequest>("/api/v1/orders", payload);
    return normalizeDetailStatus(result);
}

export async function trackOrder(orderId: number, phone: string): Promise<OrderDetailDto | null> {
    const params = new URLSearchParams({
        orderId: String(orderId),
        phone,
    });
    try {
        const result = await apiClient.get<OrderDetailDto>(`/api/v1/orders/track?${params}`);
        return normalizeDetailStatus(result);
    } catch (err) {
        if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
            return null;
        }
        throw err;
    }
}

export async function getOrders(
    page: number = 1,
    pageSize: number = 20,
    status?: OrderStatus,
): Promise<PaginatedResponse<OrderSummaryDto>> {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });
    if (status) params.set("status", status);
    const result = await apiClient.get<PaginatedResponse<OrderSummaryDto>>(`/api/v1/orders?${params}`);
    result.items = result.items.map((o) => ({ ...o, status: normalizeOrderStatus(o.status) }));
    return result;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderDetailDto> {
    const result = await apiClient.patch<OrderDetailDto, UpdateOrderStatusRequest>(`/api/v1/orders/${orderId}/status`, { status });
    return normalizeDetailStatus(result);
}
