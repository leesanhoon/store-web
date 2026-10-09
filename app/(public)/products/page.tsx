import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductCatalog from "@/components/mobile-store/ProductCatalog";
import type { CategoryTreeNode } from "@/lib/api/categories";
import { isLidProduct, type ProductDto } from "@/lib/api/products";
import {
    getCatalogCategoryTree,
    getCatalogProducts,
} from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Sản phẩm" };

function collectChildCategories(tree: CategoryTreeNode[]) {
    const children: { id: number; name: string }[] = [];
    for (const node of tree) {
        for (const child of node.children) {
            children.push({ id: child.id, name: child.name });
        }
    }
    return children;
}

async function loadCatalog() {
    try {
        // One request: the product list already contains the lids.
        const [all, categoryTree] = await Promise.all([
            getCatalogProducts(),
            getCatalogCategoryTree().catch(() => [] as CategoryTreeNode[]),
        ]);
        return {
            products: all.filter((p) => !isLidProduct(p)),
            lids: all.filter(isLidProduct),
            categories: collectChildCategories(categoryTree),
            error: false,
        };
    } catch (error) {
        console.error("Không tải được danh sách sản phẩm:", error);
        return {
            products: [] as ProductDto[],
            lids: [] as ProductDto[],
            categories: [] as { id: number; name: string }[],
            error: true,
        };
    }
}

export default async function ProductsPage() {
    await connection();
    const { products, lids, categories, error } = await loadCatalog();
    const hasItems = products.length > 0 || lids.length > 0;

    return (
        <div className="catalog-screen">
            <MobileTopBar title="Sản phẩm" />
            {error ? (
                <p className="mobile-alert">
                    Không tải được sản phẩm. Vui lòng thử lại sau ít phút.
                </p>
            ) : null}
            {!error && !hasItems ? (
                <p className="mobile-alert">Chưa có sản phẩm nào.</p>
            ) : null}
            {hasItems ? (
                <Suspense
                    fallback={
                        <section className="catalog-grid" aria-hidden="true" />
                    }
                >
                    <ProductCatalog
                        products={products}
                        lids={lids}
                        categories={categories}
                    />
                </Suspense>
            ) : null}
        </div>
    );
}
