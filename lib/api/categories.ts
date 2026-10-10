import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

export type CreateCategoryPayload = {
    name: string;
    description?: string;
    parentId?: number | null;
};

export type CategoryDto = {
    id: number;
    name: string;
    description: string;
    parentId: number | null;
    isRoot: boolean;
};

export type CategoryTreeNode = CategoryDto & {
    children: CategoryTreeNode[];
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

const LIST_PAGE_SIZE = 100;
const LIST_MAX_PAGES = 50;

function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
        return response;
    }

    return response.items ?? response.value ?? response.Value ?? [];
}

async function getAllCategories() {
    const items: CategoryDto[] = [];
    for (let page = 1; page <= LIST_MAX_PAGES; page++) {
        const query = buildPaginationQuery({ page, pageSize: LIST_PAGE_SIZE });
        const response = await apiClient.get<CollectionResponse<CategoryDto>>(`/api/v1/Categories${query}`);
        if (Array.isArray(response)) {
            return response;
        }
        const batch = unwrapCollection(response);
        items.push(...batch);
        const isLastPage = typeof response.totalCount === "number" ? items.length >= response.totalCount : batch.length < LIST_PAGE_SIZE;
        if (batch.length === 0 || isLastPage) break;
    }
    return items;
}

export async function getCategories(): Promise<CategoryDto[]>;
export async function getCategories(params: PaginationParams): Promise<PaginatedResponse<CategoryDto>>;
export async function getCategories(params?: PaginationParams) {
    if (typeof params !== "object") return getAllCategories();
    const query = buildPaginationQuery(params);
    const response = await apiClient.get<CollectionResponse<CategoryDto>>(`/api/v1/Categories${query}`);
    if (params?.page && !Array.isArray(response)) {
        return response as PaginatedResponse<CategoryDto>;
    }
    return unwrapCollection(response);
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
    return apiClient.get<CategoryTreeNode[]>("/api/v1/Categories/tree");
}

export async function getCategory(id: number) {
    return apiClient.get<CategoryDto>(`/api/v1/Categories/${id}`);
}

export async function createCategory(payload: CreateCategoryPayload) {
    return apiClient.post<CategoryDto, CreateCategoryPayload>("/api/v1/Categories", payload);
}

export async function updateCategory(id: number, payload: CreateCategoryPayload) {
    return apiClient.put<unknown, CreateCategoryPayload>(`/api/v1/Categories/${id}`, payload);
}

export async function deleteCategory(id: number) {
    return apiClient.delete<string>(`/api/v1/Categories/${id}`, {
        headers: {
            accept: "*/*",
        },
    });
}
