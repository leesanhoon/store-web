import {
    apiClient,
    buildPaginationQuery,
    type PaginatedResponse,
    type PaginationParams,
} from "@/lib/api/http";

export type PartnerImageDto = {
    id: number;
    imageUrl: string;
    displayOrder: number;
};

export type PartnerDto = {
    id: number;
    name: string;
    address: string;
    phoneNumber: string | null;
    description: string | null;
    avatarImageUrl: string | null;
    galleryImages: PartnerImageDto[];
    createdAtUtc: string;
};

function unwrapCollection(data: unknown): PartnerDto[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.items)) return record.items as PartnerDto[];
        if (Array.isArray(record.value)) return record.value as PartnerDto[];
        if (Array.isArray(record.Value)) return record.Value as PartnerDto[];
    }
    return [];
}

export async function getPartners(
    params?: PaginationParams,
): Promise<PaginatedResponse<PartnerDto>> {
    const query = buildPaginationQuery(params);
    const data = await apiClient.get<PaginatedResponse<PartnerDto>>(
        `/api/v1/partners${query}`,
    );

    return {
        ...data,
        items: unwrapCollection(data),
    };
}

export async function getPartner(id: number): Promise<PartnerDto> {
    return apiClient.get<PartnerDto>(`/api/v1/partners/${id}`);
}
