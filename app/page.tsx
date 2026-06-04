import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { getCatalogProducts } from "@/lib/data/catalog";
import { formatCurrency, getFeaturedProducts, getProductDisplayInfo } from "@/lib/products/display";
import { getHomeFeatures } from "@/lib/data/gallery";

async function loadProducts() {
  try {
    const products = await getCatalogProducts();
    return { products: getFeaturedProducts(products, 8), error: "" };
  } catch (error) {
    return { products: [], error: error instanceof Error ? error.message : "Không thể tải sản phẩm." };
  }
}

const heroSignals = ["Ly PET / PP / giấy", "In logo theo yêu cầu", "Báo giá theo số lượng", "Gửi yêu cầu qua Gmail"];
const partnerBrands = ["The Brew House", "Cold Drink Lab", "Paper & Sip", "Urban Juice", "Cafe Mộc", "Savor Studio"];
const reviews = [
  { name: "Minh Anh", role: "Procurement Lead", company: "The Brew House", quote: "Quy trình đặt in rõ ràng, dễ duyệt mẫu và rất phù hợp đơn hàng lớn." },
  { name: "Hoàng Nam", role: "Operations Manager", company: "Cold Drink Lab", quote: "Chúng tôi cần tốc độ và tính nhất quán — website truyền tải đúng tinh thần đó." },
  { name: "Thu Hà", role: "Brand Owner", company: "Paper & Sip", quote: "Rõ vật liệu, rõ kích thước, rõ bước đặt hàng. Cảm giác rất đáng tin." },
];

async function ProductGrid() {
  const { products, error } = await loadProducts();

  if (error) {
    return <div className="panel p-6 text-sm font-medium text-rose-700">{error}</div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => {
        const info = getProductDisplayInfo(product);

        return (
          <article key={product.id} className="group overflow-hidden rounded-[1.75rem] border border-[#e7ddd1] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
            <Link href={`/product/${product.id}`} className="block p-4">
              <div className="rounded-[1.25rem] bg-[linear-gradient(180deg,#f8f3ec_0%,#fdfaf6_100%)] p-4">
                <div className="flex aspect-[4/3] items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/80 text-7xl">
                  {info.icon}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{product.categoryName || info.cupType}</p>
                <h3 className="text-xl font-semibold tracking-tight text-header">{product.name}</h3>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold text-header">{formatCurrency(product.price)}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">Xem chi tiết</span>
                </div>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-[11px] font-medium text-slate-600 sm:grid-cols-4">
              <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-center">{info.cupType}</span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-center">{info.volume}</span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-center">{info.unit}</span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-2 text-center">{info.printOption}</span>
            </div>
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
              <Link href={`/product/${product.id}`} className="button-secondary">Xem mẫu</Link>
              <AddToCartButton productId={product.id} name={product.name} price={product.price} categoryName={product.categoryName || info.cupType} label="Chọn ly" />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const processCards = getHomeFeatures().slice(0, 4);

  return (
    <div className="surface-gradient">
      <section className="page-shell pt-6 sm:pt-8 lg:pt-10">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#e7ddd1] bg-white shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_.95fr] lg:p-12">
            <div className="flex flex-col justify-center gap-6">
              <span className="inline-flex w-fit rounded-full border border-[#e7ddd1] bg-[#f8f3ec] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">B2B cup printing showroom</span>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-header sm:text-5xl lg:text-6xl">Ly in logo, trưng bày đẹp, đặt hàng rõ ràng.</h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Khám phá các mẫu ly PET, PP và giấy; xem sản phẩm bán chạy; duyệt đối tác đang sử dụng; và gửi yêu cầu báo giá qua Gmail trong một luồng duy nhất.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/products" className="button-primary">Khám phá sản phẩm</Link>
                <Link href="/cart" className="button-secondary">Xem giỏ hàng</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroSignals.map((item) => <div key={item} className="rounded-2xl border border-[#e7ddd1] bg-[#fbf7f2] px-4 py-3 text-sm font-medium text-slate-700">{item}</div>)}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 overflow-hidden rounded-[1.75rem] border border-[#e7ddd1] bg-[#fbf7f2] p-4 shadow-[var(--shadow-card)]">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950">
                  <Image src="/images/mockups/hero-cups.png" alt="Cụm mockup ly in logo" width={1280} height={900} className="h-auto w-full object-cover opacity-90" priority />
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]"><p className="text-3xl font-semibold tracking-tight text-header">1.000+</p><p className="mt-2 text-sm leading-6 text-slate-600">Mức đặt hàng linh hoạt cho quán, chuỗi F&B và thương hiệu sự kiện.</p></div>
              <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]"><p className="text-3xl font-semibold tracking-tight text-header">24h</p><p className="mt-2 text-sm leading-6 text-slate-600">Phản hồi báo giá nhanh cho nhu cầu in và đặt số lượng lớn.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="page-shell section-gap">
        <div className="grid gap-4 rounded-[1.75rem] border border-[#e7ddd1] bg-white p-6 shadow-[var(--shadow-card)] lg:grid-cols-[0.82fr_1.18fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Đối tác nổi bật</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">Các thương hiệu đang dùng ly in theo cách chuyên nghiệp</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {partnerBrands.map((brand) => <div key={brand} className="rounded-2xl border border-[#e7ddd1] bg-[#fbf7f2] px-4 py-4 text-sm font-semibold text-slate-700">{brand}</div>)}
          </div>
        </div>
      </section>

      <section id="categories" className="page-shell section-gap">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Danh mục nổi bật</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">Mẫu ly theo nhu cầu sử dụng</h2>
          </div>
          <Link href="/products" className="button-ghost hidden sm:inline-flex">Xem tất cả</Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "PET Cups", description: "Trong, sáng, phù hợp đồ lạnh và take-away.", image: "/images/mockups/pet-500-amber.png" },
            { title: "PP Cups", description: "Dày và chắc hơn, phù hợp đồ nóng và giao hàng.", image: "/images/mockups/pet-700-velvet.png" },
            { title: "Paper Cups", description: "Gọn, sạch, phù hợp quán cà phê và thương hiệu xanh.", image: "/images/mockups/paper-360-linen.png" },
            { title: "Printed Cups", description: "Duyệt mockup, chọn màu và cấu hình in logo rõ ràng.", image: "/images/mockups/logo-cup-500-urban.png" },
          ].map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[1.75rem] border border-[#e7ddd1] bg-white shadow-[var(--shadow-card)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#fbf7f2]">
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-header">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="best-sellers" className="page-shell section-gap">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Bán chạy / in nhiều</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">Sản phẩm được chọn nhiều nhất</h2>
          </div>
          <Link href="/products" className="button-ghost hidden sm:inline-flex">Đi tới danh mục</Link>
        </div>
        <div className="mt-6">
          <ProductGrid />
        </div>
      </section>

      <section id="printing-process" className="page-shell section-gap">
        <div className="grid gap-5 lg:grid-cols-4">
          {processCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quy trình</p>
              <h3 className="mt-3 text-xl font-semibold text-header">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="reviews" className="page-shell section-gap">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Feedback khách hàng</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">Cảm nhận từ khách hàng sử dụng thực tế</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.name} className="rounded-[1.5rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm leading-7 text-slate-600">“{review.quote}”</p>
                <div className="mt-5 border-t border-dashed border-[#eadfce] pt-4">
                  <p className="font-semibold text-header">{review.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{review.role} · {review.company}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-gap pb-12">
        <div className="rounded-[2rem] border border-[#e7ddd1] bg-[#111827] p-8 text-white shadow-[var(--shadow-soft)] md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Sẵn sàng đặt hàng</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Gửi brief, nhận báo giá, chốt mẫu in.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Giỏ hàng và trang chi tiết đã sẵn luồng chọn sản phẩm. Chỉ cần thêm vào giỏ, điền thông tin và gửi sang Gmail để bạn xử lý nhanh.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/products" className="button-secondary">Chọn sản phẩm</Link>
              <Link href="/cart" className="button-primary">Mở giỏ và gửi đơn</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
