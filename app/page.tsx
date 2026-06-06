import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { getCatalogCategories, getCatalogProducts } from "@/lib/data/catalog";
import { getHomeFeatures } from "@/lib/data/gallery";
import { formatCurrency, getFeaturedProducts, getProductDisplayInfo } from "@/lib/products/display";

async function loadProducts() {
  try {
    const products = await getCatalogProducts();
    return { products: getFeaturedProducts(products, 8), error: "" };
  } catch (error) {
    return { products: [], error: error instanceof Error ? error.message : "Khong the tai san pham." };
  }
}

async function loadCategories() {
  try {
    return { categories: (await getCatalogCategories()).slice(0, 4), error: "" };
  } catch (error) {
    return { categories: [], error: error instanceof Error ? error.message : "Khong the tai danh muc." };
  }
}

async function loadProcessCards() {
  try {
    return { processCards: (await getHomeFeatures()).slice(0, 4), error: "" };
  } catch (error) {
    return { processCards: [], error: error instanceof Error ? error.message : "Khong the tai quy trinh tu API." };
  }
}

const heroSignals = ["Ly PET / PP / giay", "In logo theo yeu cau", "Bao gia theo so luong", "Gui yeu cau qua Gmail"];

async function ProductGrid() {
  const { products, error } = await loadProducts();

  if (error) {
    return <div className="panel p-6 text-sm font-medium text-rose-700">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="panel p-8 text-center text-sm font-medium text-slate-600">Chua co san pham trong he thong.</div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => {
        const info = getProductDisplayInfo(product);

        return (
          <article key={product.id} className="group overflow-hidden rounded-[1.75rem] border border-[#e7ddd1] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
            <Link href={`/product/${product.id}`} className="block p-4">
              <div className="rounded-[1.25rem] bg-[linear-gradient(180deg,#f8f3ec_0%,#fdfaf6_100%)] p-4">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/80">
                  {info.imageSrc ? (
                    <Image src={info.imageSrc} alt={product.name} width={800} height={600} className="h-full w-full object-cover" loading="lazy" quality={82} />
                  ) : (
                    <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chua co anh</span>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{product.categoryName || info.cupType}</p>
                <h3 className="text-xl font-semibold tracking-tight text-header">{product.name}</h3>
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold text-header">{formatCurrency(product.price)}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">Chi tiet</span>
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
              <Link href={`/product/${product.id}`} className="button-secondary">Xem chi tiet</Link>
              <AddToCartButton productId={product.id} name={product.name} price={product.price} categoryName={product.categoryName || info.cupType} label="Chon ly" />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const [{ categories, error: categoriesError }, { processCards, error: processError }] = await Promise.all([loadCategories(), loadProcessCards()]);

  return (
    <div className="surface-gradient">
      <section className="page-shell pt-6 sm:pt-8 lg:pt-10">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#e7ddd1] bg-white shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_.95fr] lg:p-12">
            <div className="flex flex-col justify-center gap-6">
              <span className="inline-flex w-fit rounded-full border border-[#e7ddd1] bg-[#f8f3ec] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">B2B cup printing showroom</span>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-header sm:text-5xl lg:text-6xl">Ly in logo, trung bay dep, dat hang ro rang.</h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Kham pha san pham tu API, xem cau hinh in, them vao gio va gui yeu cau bao gia trong mot luong duy nhat.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/products" className="button-primary">Kham pha san pham</Link>
                <Link href="/cart" className="button-secondary">Xem gio hang</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroSignals.map((item) => <div key={item} className="rounded-2xl border border-[#e7ddd1] bg-[#fbf7f2] px-4 py-3 text-sm font-medium text-slate-700">{item}</div>)}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 overflow-hidden rounded-[1.75rem] border border-[#e7ddd1] bg-[#fbf7f2] p-4 shadow-[var(--shadow-card)]">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950">
                  <Image src="/images/ly/coc-nhua-ly-nhua.png" alt="Anh ly that" width={1280} height={900} className="h-auto w-full object-cover opacity-90" priority fetchPriority="high" />
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]"><p className="text-3xl font-semibold tracking-tight text-header">1.000+</p><p className="mt-2 text-sm leading-6 text-slate-600">Muc dat hang linh hoat cho quan, chuoi F&B va thuong hieu su kien.</p></div>
              <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]"><p className="text-3xl font-semibold tracking-tight text-header">24h</p><p className="mt-2 text-sm leading-6 text-slate-600">Phan hoi bao gia nhanh cho nhu cau in va dat so luong lon.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="page-shell section-gap">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Danh muc noi bat</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">Danh muc tu API</h2>
          </div>
          <Link href="/products" className="button-ghost hidden sm:inline-flex">Xem tat ca</Link>
        </div>
        {categoriesError ? <div className="mt-6 panel p-5 text-sm font-medium text-rose-700">{categoriesError}</div> : null}
        {!categoriesError && categories.length === 0 ? <div className="mt-6 panel p-8 text-center text-sm font-medium text-slate-600">Chua co danh muc trong he thong.</div> : null}
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-[1.75rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-xl font-semibold text-header">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="best-sellers" className="page-shell section-gap">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ban chay / in nhieu</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-header">San pham duoc chon nhieu nhat</h2>
          </div>
          <Link href="/products" className="button-ghost hidden sm:inline-flex">Di toi danh muc</Link>
        </div>
        <div className="mt-6">
          <ProductGrid />
        </div>
      </section>

      <section id="printing-process" className="page-shell section-gap">
        {processError ? <div className="panel p-5 text-sm font-medium text-rose-700">{processError}</div> : null}
        {!processError && processCards.length === 0 ? <div className="panel p-8 text-center text-sm font-medium text-slate-600">Chua co du lieu quy trinh trong he thong.</div> : null}
        <div className="grid gap-5 lg:grid-cols-4">
          {processCards.map((card) => (
            <article key={card.id} className="rounded-[1.75rem] border border-[#e7ddd1] bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quy trinh</p>
              <h3 className="mt-3 text-xl font-semibold text-header">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell section-gap pb-12">
        <div className="rounded-[2rem] border border-[#e7ddd1] bg-[#111827] p-8 text-white shadow-[var(--shadow-soft)] md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">San sang dat hang</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Gui brief, nhan bao gia, chot mau in.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Gio hang va trang chi tiet da san luong chon san pham. Them vao gio, dien thong tin va gui sang Gmail de xu ly nhanh.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/products" className="button-secondary">Chon san pham</Link>
              <Link href="/cart" className="button-primary">Mo gio va gui don</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
