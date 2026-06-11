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

export type CreatePartnerPayload = {
    name: string;
    address: string;
    phoneNumber?: string;
    description?: string;
    avatarImage?: File;
    galleryImages?: File[];
};

function toPartnerFormData(payload: CreatePartnerPayload) {
    const formData = new FormData();
    formData.append("Name", payload.name);
    formData.append("Address", payload.address);
    if (payload.phoneNumber?.trim()) {
        formData.append("PhoneNumber", payload.phoneNumber.trim());
    }
    if (payload.description?.trim()) {
        formData.append("Description", payload.description.trim());
    }
    if (payload.avatarImage) {
        formData.append("AvatarImage", payload.avatarImage);
    }
    if (payload.galleryImages) {
        for (const file of payload.galleryImages) {
            formData.append("GalleryImages", file);
        }
    }
    return formData;
}

export async function createPartner(payload: CreatePartnerPayload) {
    return apiClient.post<PartnerDto, FormData>(
        "/api/v1/partners",
        toPartnerFormData(payload),
    );
}

export async function updatePartner(
    id: number,
    payload: CreatePartnerPayload,
) {
    return apiClient.put<PartnerDto, FormData>(
        `/api/v1/partners/${id}`,
        toPartnerFormData(payload),
    );
}

export async function deletePartner(id: number) {
    return apiClient.delete<void>(`/api/v1/partners/${id}`);
}
