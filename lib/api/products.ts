import { apiClient } from "@/lib/api/http";

export type ProductGalleryImageDto = {
    id: number;
    imageUrl: string;
    imageType: string;
    displayOrder: number;
    createdAtUtc: string;
};

export type ProductDto = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    avatarImageUrl?: string | null;
    galleryImages?: ProductGalleryImageDto[];
};

export type CreateProductPayload = {
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
};

export type ProductUploadPayload = CreateProductPayload & {
    avatarImage?: File | null;
    galleryImages?: File[];
};

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

const SUPPORTED_PRODUCT_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

function normalizeProduct(product: ProductDto): ProductDto {
    return { ...product, description: product.description ?? "", categoryName: product.categoryName ?? "" };
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

    formData.append("Price", String(payload.price));
    formData.append("StockQuantity", String(payload.stockQuantity));
    formData.append("CategoryId", String(payload.categoryId));

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

export async function getProducts() {
    const response = await apiClient.get<CollectionResponse<ProductDto>>("/api/v1/Products");
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

export type UpdateProductPayload = Required<CreateProductPayload>;

export async function updateProduct(id: number, payload: UpdateProductPayload) {
    return apiClient.put<unknown, UpdateProductPayload>(`/api/v1/Products/${id}`, payload);
}

export async function deleteProduct(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Products/${id}`, { headers: { accept: "*/*" } });
}
