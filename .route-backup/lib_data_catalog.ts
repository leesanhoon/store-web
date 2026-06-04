import { getCategories } from "@/lib/api/categories";
import { getProduct, getProducts, ProductDto } from "@/lib/api/products";
import { mockCategories } from "@/lib/mock/catalog";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "1";

function isMissingBackendProduct(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();
    return message.includes("404") || message.includes("not found");
}

export async function getCatalogCategories() {
    if (useMockData) {
        return mockCategories;
    }

    return getCategories();
}

export async function getCatalogProducts() {
    return getProducts();
}

export async function getCatalogProduct(id: number): Promise<ProductDto | null> {
    if (useMockData) {
        const { mockProducts } = await import("@/lib/mock/catalog");
        return mockProducts.find((product) => product.id === id) ?? null;
    }

    try {
        return await getProduct(id);
    } catch (error) {
        if (isMissingBackendProduct(error)) {
            return null;
        }

        throw error;
    }
}

export function getIsMockDataEnabled() {
    return useMockData;
}
