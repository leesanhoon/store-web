import { apiClient, type PaginatedResponse } from "@/lib/api/http";

export type OrderStatus = "draft" | "confirmed" | "shipping" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    draft: "Nháp",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    draft: ["confirmed", "cancelled"],
    confirmed: ["shipping"],
    shipping: ["completed"],
    completed: [],
    cancelled: [],
};

export type OrderItemDto = {
    productId: number;
    productName: string;
    materialId: number | null;
    materialName: string | null;
    printTypeId: number | null;
    printTypeName: string | null;
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
};

export type UpdateOrderStatusRequest = {
    status: OrderStatus;
};

export async function createOrder(payload: CreateOrderRequest): Promise<OrderDetailDto> {
    return apiClient.post<OrderDetailDto, CreateOrderRequest>("/api/v1/orders", payload);
}

export async function trackOrder(orderId: number, phone: string): Promise<OrderDetailDto | null> {
    const params = new URLSearchParams({
        orderId: String(orderId),
        phone,
    });
    try {
        return await apiClient.get<OrderDetailDto>(`/api/v1/orders/track?${params}`);
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
    return apiClient.get<PaginatedResponse<OrderSummaryDto>>(`/api/v1/orders?${params}`);
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderDetailDto> {
    return apiClient.patch<OrderDetailDto, UpdateOrderStatusRequest>(`/api/v1/orders/${orderId}/status`, { status });
}
