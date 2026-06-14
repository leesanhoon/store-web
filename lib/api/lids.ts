import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

export type LidPriceDto = {
    id: number;
    diameterMm: number;
    sizeName: string;
    unitPrice: number;
};

export type LidGalleryImageDto = {
    id: number;
    imageUrl: string;
    imageType: string;
    displayOrder: number;
    createdAtUtc: string;
};

export type LidDto = {
    id: number;
    name: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    avatarImageUrl?: string | null;
    galleryImages?: LidGalleryImageDto[];
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

export type LidUploadPayload = CreateLidPayload & {
    avatarImage?: File | null;
    galleryImages?: File[];
};

type CollectionResponse<T> = T[] | { items?: T[]; value?: T[]; Value?: T[]; totalCount?: number; page?: number; pageSize?: number };

const SUPPORTED_LID_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.items ?? response.value ?? response.Value ?? [];
}

function getFileExtension(fileName: string) {
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function isSupportedLidImage(file: File) {
    return SUPPORTED_LID_IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

export function validateLidImages(avatarImage?: File | null, galleryImages: File[] = []) {
    const invalidFile = [avatarImage, ...galleryImages].find(
        (file): file is File => Boolean(file && !isSupportedLidImage(file)),
    );
    return invalidFile
        ? `Ảnh '${invalidFile.name}' phải có định dạng JPG, JPEG, PNG, WEBP hoặc GIF.`
        : "";
}

function toLidFormData(payload: LidUploadPayload) {
    const formData = new FormData();
    formData.append("Name", payload.name);
    if (payload.description?.trim()) {
        formData.append("Description", payload.description.trim());
    }
    formData.append("CategoryId", String(payload.categoryId));
    payload.prices.forEach((p, i) => {
        formData.append(`Prices[${i}].DiameterMm`, String(p.diameterMm));
        if (p.sizeName) formData.append(`Prices[${i}].SizeName`, p.sizeName);
        formData.append(`Prices[${i}].UnitPrice`, String(p.unitPrice));
    });
    if (payload.avatarImage) {
        formData.append("AvatarImage", payload.avatarImage);
    }
    payload.galleryImages?.forEach((file) => formData.append("GalleryImages", file));
    return formData;
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

export async function createLid(payload: LidUploadPayload) {
    return apiClient.post<LidDto, FormData>("/api/v1/Lids", toLidFormData(payload));
}

export async function updateLid(id: number, payload: CreateLidPayload) {
    return apiClient.put<unknown, CreateLidPayload>(`/api/v1/Lids/${id}`, payload);
}

export async function deleteLid(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Lids/${id}`, { headers: { accept: "*/*" } });
}

export async function addLidImages(
    id: number,
    avatarImage?: File | null,
    galleryImages?: File[],
) {
    const imageError = validateLidImages(avatarImage, galleryImages);
    if (imageError) throw new Error(imageError);

    const formData = new FormData();
    if (avatarImage) formData.append("AvatarImage", avatarImage);
    if (galleryImages) {
        for (const file of galleryImages) formData.append("GalleryImages", file);
    }
    return apiClient.post<LidDto, FormData>(`/api/v1/Lids/${id}/images`, formData);
}

export async function deleteLidImage(lidId: number, imageId: number) {
    return apiClient.delete<unknown>(`/api/v1/Lids/${lidId}/images/${imageId}`);
}
