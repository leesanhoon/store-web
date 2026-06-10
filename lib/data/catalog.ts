import { getCategories, getCategoryTree, type CategoryTreeNode } from "@/lib/api/categories";
import { getProduct, getProducts, ProductDto } from "@/lib/api/products";

function isMissingBackendProduct(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();
    return message.includes("404") || message.includes("not found");
}

export async function getCatalogCategories() {
    return getCategories();
}

export async function getCatalogCategoryTree(): Promise<CategoryTreeNode[]> {
    return getCategoryTree();
}

export async function getCatalogProducts() {
    return getProducts();
}

export async function getCatalogProduct(id: number): Promise<ProductDto | null> {
    try {
        return await getProduct(id);
    } catch (error) {
        if (isMissingBackendProduct(error)) {
            return null;
        }

        throw error;
    }
}
