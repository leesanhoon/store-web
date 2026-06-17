import { connection } from "next/server";
import { Suspense } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductCatalog from "@/components/mobile-store/ProductCatalog";
import type { CategoryTreeNode } from "@/lib/api/categories";
import type { LidDto } from "@/lib/api/lids";
import type { ProductDto } from "@/lib/api/products";
import {
    getCatalogCategoryTree,
    getCatalogLids,
    getCatalogProducts,
} from "@/lib/data/catalog";

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
        const [products, lids, categoryTree] = await Promise.all([
            getCatalogProducts(),
            getCatalogLids(),
            getCatalogCategoryTree().catch(() => [] as CategoryTreeNode[]),
        ]);
        return {
            products,
            lids,
            categories: collectChildCategories(categoryTree),
            error: "",
        };
    } catch (error) {
        return {
            products: [] as ProductDto[],
            lids: [] as LidDto[],
            categories: [] as { id: number; name: string }[],
            error:
                error instanceof Error
                    ? error.message
                    : "Không thể tải danh sách sản phẩm.",
        };
    }
}

export default async function ProductsPage() {
    await connection();
    const { products, lids, categories, error } = await loadCatalog();
    const hasItems = products.length > 0 || lids.length > 0;

    return (
        <MobileAppShell>
            <div className="catalog-screen">
                <MobileTopBar
                    title="Danh mục sản phẩm"
                    backHref="/"
                    backLabel="Quay lại trang chủ"
                />
                {error ? <p className="mobile-alert">{error}</p> : null}
                {!error && !hasItems ? (
                    <p className="mobile-alert">Chưa có sản phẩm nào.</p>
                ) : null}
                {hasItems ? (
                    <Suspense
                        fallback={
                            <section
                                className="catalog-grid"
                                aria-hidden="true"
                            />
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
        </MobileAppShell>
    );
}
