import { connection } from "next/server";
import { Suspense } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductCatalog from "@/components/mobile-store/ProductCatalog";
import type { LidDto } from "@/lib/api/lids";
import type { ProductDto } from "@/lib/api/products";
import { getCatalogLids, getCatalogProducts } from "@/lib/data/catalog";

async function loadCatalog(): Promise<{
    products: ProductDto[];
    lids: LidDto[];
    error: string;
}> {
    try {
        const [products, lids] = await Promise.all([
            getCatalogProducts(),
            getCatalogLids(),
        ]);
        return { products, lids, error: "" };
    } catch (error) {
        return {
            products: [],
            lids: [],
            error:
                error instanceof Error
                    ? error.message
                    : "Không thể tải danh sách sản phẩm.",
        };
    }
}

export default async function ProductsPage() {
    await connection();
    const { products, lids, error } = await loadCatalog();
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
                        <ProductCatalog products={products} lids={lids} />
                    </Suspense>
                ) : null}
            </div>
        </MobileAppShell>
    );
}
