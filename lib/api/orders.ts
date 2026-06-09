import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

export type OrderSummaryDto = {
    id: number;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAtUtc: string;
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
    customerPhone: string | null;
    customerEmail: string | null;
    note: string | null;
    totalAmount: number;
    status: string;
    createdAtUtc: string;
    items: OrderItemDto[];
};

export type CreateOrderRequest = {
    customerName: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    note?: string | null;
    items: Array<{
        productId: number;
        materialId?: number | null;
        printTypeId?: number | null;
        quantity: number;
        unitPrice: number;
    }>;
};

export type OrderStatus = "draft" | "confirmed" | "shipping" | "completed" | "cancelled";

export const ORDER_STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
    draft: ["confirmed", "cancelled"],
    confirmed: ["shipping"],
    shipping: ["completed"],
    completed: [],
    cancelled: [],
};

type CollectionResponse<T> = T[] | { items?: T[]; value?: T[]; Value?: T[]; totalCount?: number; page?: number; pageSize?: number };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.items ?? response.value ?? response.Value ?? [];
}

export async function getOrders(): Promise<OrderSummaryDto[]>;
export async function getOrders(params: PaginationParams): Promise<PaginatedResponse<OrderSummaryDto>>;
export async function getOrders(params?: PaginationParams) {
    const query = buildPaginationQuery(params);
    const response = await apiClient.get<CollectionResponse<OrderSummaryDto>>(`/api/v1/Orders${query}`);
    if (params?.page && !Array.isArray(response)) {
        return response as PaginatedResponse<OrderSummaryDto>;
    }
    return unwrapCollection(response);
}

export async function getOrder(id: number) {
    return apiClient.get<OrderDetailDto>(`/api/v1/Orders/${id}`);
}

export async function createOrder(payload: CreateOrderRequest) {
    return apiClient.post<unknown, CreateOrderRequest>("/api/v1/Orders", payload);
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
    return apiClient.put<{ status: string }, { status: string }>(`/api/v1/Orders/${id}/status`, { status });
}

export async function deleteOrder(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Orders/${id}`, { headers: { accept: "*/*" } });
}
