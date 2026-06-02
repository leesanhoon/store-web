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

type CollectionResponse<T> = T[] | {
    value?: T[];
    Value?: T[];
    count?: number;
    Count?: number;
};

function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
        return response;
    }

    return response.value ?? response.Value ?? [];
}

export async function getProducts() {
    const response = await apiClient.get<CollectionResponse<ProductDto>>("/api/v1/Products");
    return unwrapCollection(response);
}

export async function getProduct(id: number) {
    return apiClient.get<ProductDto>(`/api/v1/Products/${id}`);
}

export async function createProduct(payload: CreateProductPayload) {
    return apiClient.post<unknown, CreateProductPayload>("/api/v1/Products", payload);
}

export type UpdateProductPayload = CreateProductPayload;

export async function updateProduct(id: number, payload: UpdateProductPayload) {
    return apiClient.put<unknown, UpdateProductPayload>(`/api/v1/Products/${id}`, payload);
}

export async function deleteProduct(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Products/${id}`, {
        headers: {
            accept: "*/*",
        },
    });
}
