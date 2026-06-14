import { apiClient, buildPaginationQuery, type PaginatedResponse, type PaginationParams } from "@/lib/api/http";

export type ProductGalleryImageDto = {
    id: number;
    imageUrl: string;
    imageType: string;
    displayOrder: number;
    createdAtUtc: string;
};

export type PriceTierDto = {
    id: number;
    minQuantity: number;
    unitPrice: number;
};

export type ProductVariantDto = {
    id: number;
    capacityMl: number;
    diameterMm: number;
    priceTiers: PriceTierDto[];
};

export type ProductLidLinkDto = {
    id: number;
    lidId: number;
    lidName: string;
};

export type ProductDto = {
    id: number;
    name: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    avatarImageUrl?: string | null;
    galleryImages?: ProductGalleryImageDto[];
    variants: ProductVariantDto[];
    lids: ProductLidLinkDto[];
};

export type CreateProductVariant = {
    capacityMl: number;
    diameterMm: number;
    priceTiers: Array<{ minQuantity: number; unitPrice: number }>;
};

export type CreateProductPayload = {
    name: string;
    description?: string;
    categoryId: number;
    variants: CreateProductVariant[];
    lidIds?: number[];
};

export type ProductUploadPayload = CreateProductPayload & {
    avatarImage?: File | null;
    galleryImages?: File[];
};

export type UpdateProductPayload = {
    name: string;
    description?: string;
    categoryId: number;
    variants: CreateProductVariant[];
    lidIds?: number[];
};

type CollectionResponse<T> = T[] | { items?: T[]; value?: T[]; Value?: T[]; totalCount?: number; page?: number; pageSize?: number };

const SUPPORTED_PRODUCT_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.items ?? response.value ?? response.Value ?? [];
}

function normalizeProduct(product: ProductDto): ProductDto {
    return {
        ...product,
        description: product.description ?? "",
        categoryName: product.categoryName ?? "",
        variants: product.variants ?? [],
        lids: product.lids ?? [],
    };
}

function getFileExtension(fileName: string) {
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function isSupportedProductImage(file: File) {
    return SUPPORTED_PRODUCT_IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

export function validateProductImages(avatarImage?: File | null, galleryImages: File[] = []) {
    const invalidFile = [avatarImage, ...galleryImages].find((file): file is File => Boolean(file && !isSupportedProductImage(file)));
    return invalidFile ? `Ảnh '${invalidFile.name}' phải có định dạng JPG, JPEG, PNG, WEBP hoặc GIF.` : "";
}

function toFormData(payload: ProductUploadPayload) {
    const formData = new FormData();
    formData.append("Name", payload.name);

    if (payload.description?.trim()) {
        formData.append("Description", payload.description.trim());
    }

    formData.append("CategoryId", String(payload.categoryId));

    payload.variants.forEach((v, i) => {
        formData.append(`Variants[${i}].CapacityMl`, String(v.capacityMl));
        formData.append(`Variants[${i}].DiameterMm`, String(v.diameterMm));
        v.priceTiers.forEach((t, j) => {
            formData.append(`Variants[${i}].PriceTiers[${j}].MinQuantity`, String(t.minQuantity));
            formData.append(`Variants[${i}].PriceTiers[${j}].UnitPrice`, String(t.unitPrice));
        });
    });

    if (payload.lidIds) {
        for (const lidId of payload.lidIds) {
            formData.append("LidIds", String(lidId));
        }
    }

    if (payload.avatarImage) {
        formData.append("AvatarImage", payload.avatarImage);
    }

    payload.galleryImages?.forEach((file) => formData.append("GalleryImages", file));

    return formData;
}

export function normalizeProductApiError(error: unknown) {
    if (!(error instanceof Error)) {
        return "Không thể lưu sản phẩm.";
    }

    const message = error.message.toLowerCase();
    if (message.includes("rfc9110") || message.includes('"status":500') || message.includes("an error occurred while processing your request")) {
        return "Backend đang lỗi khi cập nhật sản phẩm. Vui lòng thử lại sau hoặc kiểm tra payload.";
    }

    return error.message || "Không thể lưu sản phẩm.";
}

export async function getProducts(): Promise<ProductDto[]>;
export async function getProducts(params: PaginationParams): Promise<PaginatedResponse<ProductDto>>;
export async function getProducts(params?: PaginationParams) {
    const query = buildPaginationQuery(params);
    const response = await apiClient.get<CollectionResponse<ProductDto>>(`/api/v1/Products${query}`);
    if (params?.page && !Array.isArray(response)) {
        const paginated = response as PaginatedResponse<ProductDto>;
        return { ...paginated, items: (paginated.items ?? []).map(normalizeProduct) };
    }
    return unwrapCollection(response).map(normalizeProduct);
}

export async function getProduct(id: number) {
    const product = await apiClient.get<ProductDto>(`/api/v1/Products/${id}`);
    return normalizeProduct(product);
}

export async function createProduct(payload: ProductUploadPayload) {
    const product = await apiClient.post<ProductDto, FormData>("/api/v1/Products", toFormData(payload), {
        headers: { Accept: "application/json, text/plain, */*" },
    });
    return normalizeProduct(product);
}

export async function updateProduct(id: number, payload: UpdateProductPayload) {
    return apiClient.put<unknown, UpdateProductPayload>(`/api/v1/Products/${id}`, payload);
}

export async function deleteProduct(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Products/${id}`, { headers: { accept: "*/*" } });
}

export async function addProductImages(
    id: number,
    avatarImage?: File | null,
    galleryImages?: File[],
) {
    const imageError = validateProductImages(avatarImage, galleryImages);
    if (imageError) throw new Error(imageError);

    const formData = new FormData();
    if (avatarImage) formData.append("AvatarImage", avatarImage);
    if (galleryImages) {
        for (const file of galleryImages) formData.append("GalleryImages", file);
    }
    const product = await apiClient.post<ProductDto, FormData>(
        `/api/v1/Products/${id}/images`,
        formData,
    );
    return normalizeProduct(product);
}

export async function deleteProductImage(productId: number, imageId: number) {
    return apiClient.delete<unknown>(
        `/api/v1/Products/${productId}/images/${imageId}`,
    );
}

export type CompatibleLidDto = {
    id: number;
    name: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    prices: Array<{
        id: number;
        diameterMm: number;
        sizeName: string;
        unitPrice: number;
    }>;
};

export async function getCompatibleLids(productId: number) {
    return apiClient.get<CompatibleLidDto[]>(`/api/v1/Products/${productId}/compatible-lids`);
}
