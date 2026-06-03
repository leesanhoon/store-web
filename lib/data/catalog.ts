import { getCategories } from "@/lib/api/categories";
import { getProduct, getProducts, ProductDto } from "@/lib/api/products";
import { mockCategories, mockProducts } from "@/lib/mock/catalog";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "1";

export async function getCatalogCategories() {
    return useMockData ? mockCategories : getCategories();
}

export async function getCatalogProducts() {
    return useMockData ? mockProducts : getProducts();
}

export async function getCatalogProduct(id: number): Promise<ProductDto | null> {
    if (useMockData) {
        return mockProducts.find((product) => product.id === id) ?? null;
    }

    try {
        return await getProduct(id);
    } catch {
        return null;
    }
}

export function getIsMockDataEnabled() {
    return useMockData;
}

