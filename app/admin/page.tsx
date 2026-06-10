import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { getLids } from "@/lib/api/lids";
import { getMinPrice } from "@/lib/products/display";
import { AdminCard, AdminSectionHeader, adminFormatMoney } from "@/components/admin/admin-ui";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default async function AdminPage() {
  const [products, lids] = await Promise.all([
    getProducts().catch(() => []),
    getLids().catch(() => []),
  ]);

  const productsWithVariants = products.filter((p) => p.variants.length > 0);
  const productsWithoutPrice = products.filter((p) => getMinPrice(p) === null);
  const productsWithoutImage = products.filter((p) => !p.avatarImageUrl);

  const stats = [
    { label: "Tổng sản phẩm", value: products.length.toString(), delta: products.length ? "Dữ liệu API" : "Chưa có dữ liệu", suffix: "SP" },
    { label: "Có biến thể", value: productsWithVariants.length.toString(), delta: productsWithVariants.length ? "Đã cấu hình giá" : "Chưa có", suffix: "SP" },
    { label: "Tổng nắp", value: lids.length.toString(), delta: lids.length ? "Dữ liệu API" : "Chưa có dữ liệu", suffix: "loại" },
    { label: "Thiếu giá/ảnh", value: String(productsWithoutPrice.length + productsWithoutImage.length), delta: "Cần bổ sung", suffix: "SP" },
  ];

  return (
    <div className="space-y-3 text-[#101a36]">
      <AdminSectionHeader
        title="Dashboard tổng quan"
        action={
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-[#eadfce] bg-white px-3 text-[13px] font-bold text-[#1f2f46] shadow-sm">
            <CalendarIcon />
            Hôm nay
            <span aria-hidden="true" className="text-xl leading-none">›</span>
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-2.5">
        {stats.map((item) => (
          <AdminCard key={item.label} className="min-h-[88px] p-3.5">
            <p className="text-[13px] font-bold leading-tight text-[#1f2f46]">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[28px] font-extrabold leading-none tracking-tight text-[#101a36]">{item.value}</p>
                <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-emerald-600">{item.delta}</p>
              </div>
              {item.suffix ? <span className="pb-1 text-[12px] font-bold text-[#1f2f46]">{item.suffix}</span> : null}
            </div>
          </AdminCard>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <Link href="/admin/product?mode=create" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Thêm sản phẩm
        </Link>
        <Link href="/admin/lid?mode=create" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Thêm nắp
        </Link>
        <Link href="/admin/category" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Quản lý danh mục
        </Link>
      </section>

      <AdminCard className="p-3.5">
        <h2 className="text-[17px] font-extrabold">Sản phẩm gần đây</h2>
        {products.length === 0 ? (
          <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white px-3 py-4 text-center text-[12px] font-semibold text-slate-500">
            Chưa có sản phẩm nào.
          </div>
        ) : (
          <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white">
            {products.slice(0, 5).map((product) => {
              const minPrice = getMinPrice(product);
              return (
                <article key={product.id} className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 border-b border-[#f1e7d8] px-3 py-2.5 last:border-b-0">
                  <p className="min-w-0 truncate text-[13px] font-extrabold text-[#101a36]">{product.name}</p>
                  <p className="whitespace-nowrap text-right text-[12px] font-semibold text-[#1f2f46]">
                    {minPrice !== null ? adminFormatMoney(minPrice) : "Chưa có giá"}
                  </p>
                  <p className="text-[12px] font-semibold text-[#3d4860]">{product.categoryName}</p>
                  <p className="text-right text-[11px] font-semibold text-slate-500">
                    {product.variants.length} biến thể
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </AdminCard>

      {(productsWithoutPrice.length > 0 || productsWithoutImage.length > 0) ? (
        <AdminCard className="border-amber-200 bg-amber-50 p-3.5">
          <h2 className="text-[14px] font-extrabold text-[#101a36]">Cảnh báo vận hành</h2>
          <ul className="mt-2 space-y-1.5 text-[12px] font-semibold text-[#3d4860]">
            {productsWithoutPrice.length > 0 ? <li>{productsWithoutPrice.length} sản phẩm chưa có bảng giá (biến thể).</li> : null}
            {productsWithoutImage.length > 0 ? <li>{productsWithoutImage.length} sản phẩm thiếu ảnh đại diện.</li> : null}
          </ul>
        </AdminCard>
      ) : null}
    </div>
  );
}
