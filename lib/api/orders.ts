// Orders API has been removed in backend v1.0. This module is a stub.
// Types are kept for backward compatibility during transition.

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

import { apiClient } from "@/lib/api/http";

export async function createOrder(payload: CreateOrderRequest): Promise<OrderDetailDto> {
    return apiClient.post<OrderDetailDto, CreateOrderRequest>("/api/orders", payload);
}
