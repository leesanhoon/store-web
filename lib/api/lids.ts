import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

export type LidPriceDto = {
    id: number;
    diameterMm: number;
    sizeName: string;
    unitPrice: number;
};

export type LidDto = {
    id: number;
    name: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    prices: LidPriceDto[];
};

export type CreateLidPriceItem = {
    diameterMm: number;
    sizeName?: string;
    unitPrice: number;
};

export type CreateLidPayload = {
    name: string;
    description?: string;
    categoryId: number;
    prices: CreateLidPriceItem[];
};

type CollectionResponse<T> = T[] | { items?: T[]; value?: T[]; Value?: T[]; totalCount?: number; page?: number; pageSize?: number };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.items ?? response.value ?? response.Value ?? [];
}

export async function getLids(): Promise<LidDto[]>;
export async function getLids(params: PaginationParams): Promise<PaginatedResponse<LidDto>>;
export async function getLids(params?: PaginationParams) {
    const query = buildPaginationQuery(params);
    const response = await apiClient.get<CollectionResponse<LidDto>>(`/api/v1/Lids${query}`);
    if (params?.page && !Array.isArray(response)) {
        return response as PaginatedResponse<LidDto>;
    }
    return unwrapCollection(response);
}

export async function getLid(id: number) {
    return apiClient.get<LidDto>(`/api/v1/Lids/${id}`);
}

export async function createLid(payload: CreateLidPayload) {
    return apiClient.post<LidDto, CreateLidPayload>("/api/v1/Lids", payload);
}

export async function updateLid(id: number, payload: CreateLidPayload) {
    return apiClient.put<unknown, CreateLidPayload>(`/api/v1/Lids/${id}`, payload);
}

export async function deleteLid(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Lids/${id}`, { headers: { accept: "*/*" } });
}
