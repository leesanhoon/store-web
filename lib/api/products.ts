import { apiClient } from "@/lib/api/http";

export type ProductDto = {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
};

export type CreateProductPayload = {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
};

export async function getProducts() {
    return apiClient.get<ProductDto[]>("/api/v1/Products");
}

export async function createProduct(payload: CreateProductPayload) {
    return apiClient.post<unknown, CreateProductPayload>("/api/v1/Products", payload);
}
