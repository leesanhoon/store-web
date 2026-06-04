import { apiClient } from "@/lib/api/http";

export type CreateCategoryPayload = {
    name: string;
    description: string;
};

export type CategoryDto = {
    id: number;
    name: string;
    description: string;
    products: unknown[];
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

export async function getCategories() {
    const response = await apiClient.get<CollectionResponse<CategoryDto>>("/api/v1/Categories");
    return unwrapCollection(response);
}

export async function createCategory(payload: CreateCategoryPayload) {
    return apiClient.post<string, CreateCategoryPayload>("/api/v1/Categories", payload);
}

export async function updateCategory(id: number, payload: CreateCategoryPayload) {
    return apiClient.put<string, CreateCategoryPayload>(`/api/v1/Categories/${id}`, payload);
}

export async function deleteCategory(id: number) {
    return apiClient.delete<string>(`/api/v1/Categories/${id}`, {
        headers: {
            accept: "*/*",
        },
    });
}
