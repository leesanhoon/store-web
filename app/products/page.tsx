import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { getCatalogProducts } from "@/lib/data/catalog";
import { formatCurrency, getFeaturedProducts, getProductDisplayInfo } from "@/lib/products/display";

async function loadProducts() {
  try {
    const products = await getCatalogProducts();
    return { products: getFeaturedProducts(products, 24), error: "" };
  } catch (error) {
    return { products: [], error: error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm." };
  }
}

const filters = ["Ly PET", "Ly PP", "Ly giấy", "Có in logo", "Không in", "360ml", "500ml", "700ml"];

export default async function ProductsPage() {
  const { products, error } = await loadProducts();

  return (
    <div className="surface-gradient">
      <div className="page-shell py-6 sm:py-8">
        <section className="panel-strong overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Danh mục sản phẩm</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-header sm:text-4xl">Ly nhựa, ly giấy và cấu hình in</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">Chọn sản phẩm theo loại ly, dung tích và nhu cầu in logo. Giá hiển thị là mức cơ bản; báo giá cuối cùng phụ thuộc số lượng và quy cách in.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-[#fbf7f2] p-4 text-sm text-slate-600">
              <p className="font-semibold text-header">Gợi ý nhanh</p>
              <p className="mt-2 leading-6">Ưu tiên các mẫu bán chạy, có thể mở chi tiết để xem vật liệu và thêm vào giỏ ngay.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((filter) => <span key={filter} className="rounded-full border border-[#dbe5ef] bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">{filter}</span>)}
          </div>
        </section>

        {error ? <div className="section-gap panel p-5 text-sm font-medium text-rose-700">{error}</div> : null}
        {!error && products.length === 0 ? <div className="section-gap panel p-8 text-center text-sm font-medium text-slate-600">Chưa có sản phẩm trong hệ thống.</div> : null}

        <section className="section-gap grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const info = getProductDisplayInfo(product);
            return (
              <article key={product.id} className="panel overflow-hidden p-4">
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <Link href={`/product/${product.id}`} className="flex aspect-square items-center justify-center rounded-[1.25rem] bg-[linear-gradient(180deg,#f8f3ec_0%,#fdfaf6_100%)] text-6xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15">{info.icon}</Link>
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{product.categoryName || info.cupType}</p>
                    <h2 className="text-xl font-semibold text-header">{product.name}</h2>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
                    <p className="text-2xl font-semibold text-header">{formatCurrency(product.price)}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 md:grid-cols-4">
                  <span className="rounded-full bg-[#f8fafc] px-3 py-2">{info.cupType}</span>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-2">{info.volume}</span>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-2">{info.unit}</span>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-2">{info.printOption}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link href={`/product/${product.id}`} className="button-secondary flex-1">Chi tiết</Link>
                  <AddToCartButton productId={product.id} name={product.name} price={product.price} categoryName={product.categoryName || info.cupType} label="Thêm giỏ" />
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
