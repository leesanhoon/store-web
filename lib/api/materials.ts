import { apiClient } from "@/lib/api/http";

export type MaterialDto = {
    id: number;
    name: string;
    description: string | null;
};

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

export async function getMaterials() {
    const response = await apiClient.get<CollectionResponse<MaterialDto>>("/api/v1/Materials");
    return unwrapCollection(response);
}

export async function createMaterial(payload: { name: string; description: string }) {
    return apiClient.post<unknown, { name: string; description: string }>("/api/v1/Materials", payload);
}
