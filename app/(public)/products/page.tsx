import Link from "next/link";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import ProductCatalog from "@/components/mobile-store/ProductCatalog";
import { BackIcon, SearchIcon } from "@/components/mobile-store/icons";
import { getCatalogProducts } from "@/lib/data/catalog";
import { demoProducts } from "@/lib/data/demo-products";

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
  const displayProducts = products.length > 0 ? products : demoProducts;

  return (
    <MobileAppShell>
      <div className="catalog-screen">
        <header className="mobile-topbar">
          <Link href="/" className="icon-button ghost" aria-label="Quay lại trang chủ">
            <BackIcon className="h-6 w-6" />
          </Link>
          <h1>Danh mục sản phẩm</h1>
          <button type="button" className="icon-button ghost" aria-label="Tìm kiếm">
            <SearchIcon className="h-6 w-6" />
          </button>
        </header>

        {error ? <p className="mobile-alert">{error}</p> : null}
        <ProductCatalog products={displayProducts} />
      </div>
    </MobileAppShell>
  );
}
