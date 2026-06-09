import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

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
    items?: T[];
    value?: T[];
    Value?: T[];
    count?: number;
    Count?: number;
    totalCount?: number;
    page?: number;
    pageSize?: number;
};

function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
        return response;
    }

    return response.items ?? response.value ?? response.Value ?? [];
}

export async function getCategories(): Promise<CategoryDto[]>;
export async function getCategories(params: PaginationParams): Promise<PaginatedResponse<CategoryDto>>;
export async function getCategories(params?: PaginationParams) {
    const query = buildPaginationQuery(params);
    const response = await apiClient.get<CollectionResponse<CategoryDto>>(`/api/v1/Categories${query}`);
    if (params?.page && !Array.isArray(response)) {
        return response as PaginatedResponse<CategoryDto>;
    }
    return unwrapCollection(response);
}

export async function getCategory(id: number) {
    return apiClient.get<CategoryDto>(`/api/v1/Categories/${id}`);
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
