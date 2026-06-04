import { apiClient } from "@/lib/api/http";

export type ProductDto = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
};

export type CreateProductPayload = {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
};

export type ProductMaterialDto = {
    id: number;
    materialId: number;
    materialName: string;
    extraPrice: number;
};

export type ProductPrintOptionDto = {
    id: number;
    printTypeId: number;
    printTypeName: string;
    extraPrice: number;
};

export type ProductConfigurationsDto = {
    materials: ProductMaterialDto[];
    printOptions: ProductPrintOptionDto[];
};

export type AddMaterialConfigurationPayload = {
    materialId: number;
    extraPrice: number;
};

export type AddPrintOptionConfigurationPayload = {
    printTypeId: number;
    extraPrice: number;
};

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

function normalizeProduct(product: ProductDto): ProductDto {
    return { ...product, description: product.description ?? "", categoryName: product.categoryName ?? "" };
}

export async function getProducts() {
    const response = await apiClient.get<CollectionResponse<ProductDto>>("/api/v1/Products");
    return unwrapCollection(response).map(normalizeProduct);
}

export async function getProduct(id: number) {
    const product = await apiClient.get<ProductDto>(`/api/v1/Products/${id}`);
    return normalizeProduct(product);
}

export async function getProductConfigurations(productId: number) {
    return apiClient.get<ProductConfigurationsDto>(`/api/v1/products/${productId}/configurations`);
}

export async function addProductMaterialConfiguration(productId: number, payload: AddMaterialConfigurationPayload) {
    return apiClient.post<unknown, AddMaterialConfigurationPayload>(`/api/v1/products/${productId}/configurations/materials`, payload);
}

export async function addProductPrintOptionConfiguration(productId: number, payload: AddPrintOptionConfigurationPayload) {
    return apiClient.post<unknown, AddPrintOptionConfigurationPayload>(`/api/v1/products/${productId}/configurations/print-options`, payload);
}

export async function createProduct(payload: CreateProductPayload) {
    return apiClient.post<unknown, CreateProductPayload>("/api/v1/Products", payload);
}

export type UpdateProductPayload = CreateProductPayload;

export async function updateProduct(id: number, payload: UpdateProductPayload) {
    return apiClient.put<unknown, UpdateProductPayload>(`/api/v1/Products/${id}`, payload);
}

export async function deleteProduct(id: number) {
    return apiClient.delete<unknown>(`/api/v1/Products/${id}`, { headers: { accept: "*/*" } });
}
