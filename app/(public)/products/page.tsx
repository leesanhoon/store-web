import { Suspense } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductCatalog from "@/components/mobile-store/ProductCatalog";
import { getCatalogProducts } from "@/lib/data/catalog";

async function loadProducts() {
  try {
    return { products: await getCatalogProducts(), error: "" };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.",
    };
  }
}

export default async function ProductsPage() {
  const { products, error } = await loadProducts();

  return (
    <MobileAppShell>
      <div className="catalog-screen">
        <MobileTopBar title="Danh mục sản phẩm" backHref="/" backLabel="Quay lại trang chủ" />
        {error ? <p className="mobile-alert">{error}</p> : null}
        {!error && products.length === 0 ? <p className="mobile-alert">Chưa có sản phẩm nào.</p> : null}
        {products.length > 0 ? (
          <Suspense fallback={<section className="catalog-grid" aria-hidden="true" />}>
            <ProductCatalog products={products} />
          </Suspense>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
