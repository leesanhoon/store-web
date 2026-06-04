import { apiClient } from "@/lib/api/http";

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

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

export async function getOrders() {
    const response = await apiClient.get<CollectionResponse<OrderSummaryDto>>("/api/v1/Orders");
    return unwrapCollection(response);
}

export async function getOrder(id: number) {
    return apiClient.get<OrderDetailDto>(`/api/v1/Orders/${id}`);
}

export async function createOrder(payload: CreateOrderRequest) {
    return apiClient.post<unknown, CreateOrderRequest>("/api/v1/Orders", payload);
}
