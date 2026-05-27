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

export async function getCategories() {
    return apiClient.get<CategoryDto[]>("/api/v1/Categories");
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
