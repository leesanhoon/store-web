import { apiClient } from "@/lib/api/http";

export type PrintTypeDto = {
    id: number;
    name: string;
    colorCount: number;
    description: string | null;
};

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

export async function getPrintTypes() {
    const response = await apiClient.get<CollectionResponse<PrintTypeDto>>("/api/v1/PrintTypes");
    return unwrapCollection(response);
}

export async function createPrintType(payload: { name: string; colorCount: number; description?: string | null }) {
    return apiClient.post<unknown, { name: string; colorCount: number; description?: string | null }>("/api/v1/PrintTypes", payload);
}
