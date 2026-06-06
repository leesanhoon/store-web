import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCatalogProduct } from "@/lib/data/catalog";
import { getProductConfigurations, type ProductConfigurationsDto } from "@/lib/api/products";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import { formatCurrency, getProductDisplayInfo, getProductVariantLabels } from "@/lib/products/display";

async function loadProduct(id: string) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) return null;
  return getCatalogProduct(productId);
}

async function loadProductConfigurations(productId: number): Promise<ProductConfigurationsDto> {
  try {
    return await getProductConfigurations(productId);
  } catch {
    return { materials: [], printOptions: [] };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const info = getProductDisplayInfo(product);
  const configurations = await loadProductConfigurations(product.id);
  const variantLabels = getProductVariantLabels(product);
  const orderedGalleryImages = [...(product.galleryImages ?? [])].sort((left, right) => left.displayOrder - right.displayOrder);
  const primaryImageSrc = orderedGalleryImages[0]?.imageUrl ?? info.imageSrc;
  const useCases = ["Quán cà phê / trà sữa", "Sự kiện / hội chợ", "Take-away thương hiệu", "Đơn in logo số lượng lớn"];
  const gmailSubject = encodeURIComponent(`Yêu cầu báo giá - ${product.name}`);
  const gmailBody = encodeURIComponent([
    `Sản phẩm: ${product.name}`,
    `Danh mục: ${product.categoryName || info.cupType}`,
    `Giá tham khảo: ${formatCurrency(product.price)}`,
    "",
    "Vui lòng tư vấn giúp tôi cấu hình phù hợp và báo giá chi tiết.",
  ].join("\n"));
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${gmailSubject}&body=${gmailBody}`;

  return (
    <div className="surface-gradient">
      <div className="page-shell py-4 sm:py-6">
        <Link href="/products" className="mb-5 inline-flex text-sm font-semibold text-slate-700 hover:text-slate-950">
          ← Quay lại danh sách sản phẩm
        </Link>

        <section className="grid gap-6 rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fff8ea_0%,#fffdf8_100%)] p-4 sm:p-6">
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/80 shadow-[var(--shadow-card)] sm:min-h-[340px]">
                {primaryImageSrc ? (
                  <Image
                    src={primaryImageSrc}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    quality={88}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="px-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Chưa có ảnh sản phẩm
                  </div>
                )}
              </div>
            </div>

            {orderedGalleryImages.length > 1 ? (
              <div className="grid grid-cols-3 gap-3">
                {orderedGalleryImages.slice(1, 4).map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-[var(--shadow-card)]">
                    <Image src={image.imageUrl} alt={product.name} fill className="object-cover" loading="lazy" quality={82} sizes="(max-width: 1024px) 33vw, 12vw" />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {useCases.map((item) => (
                <div key={item} className="rounded-2xl border border-[#eadfce] bg-[#fffaf1] px-3 py-3 text-center text-xs font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="inline-flex rounded-full border border-[#eadfce] bg-[#fff8ea] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">
              {product.categoryName || info.cupType}
            </p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-header sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-semibold text-header">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              {product.description}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {variantLabels.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 font-semibold text-header">{value}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Tồn kho
                </p>
                <p className="mt-2 font-semibold text-header">
                  {product.stockQuantity.toLocaleString("vi-VN")} sản phẩm
                </p>
              </div>
              <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  MOQ gợi ý
                </p>
                <p className="mt-2 font-semibold text-header">Từ 1.000 ly</p>
              </div>
            </div>

            <section className="mt-8 rounded-[1.75rem] border border-[#e5ebf2] bg-[#f8fafc] p-5">
              <h2 className="text-xl font-semibold text-header">Cấu hình sản phẩm từ API</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {configurations.materials.length === 0 && configurations.printOptions.length === 0 ? (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-[var(--shadow-card)]">
                    Chưa có dữ liệu cấu hình từ backend, vẫn có thể chọn sản phẩm và gửi yêu cầu báo giá.
                  </div>
                ) : null}
                {configurations.materials.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {item.materialName}
                    </p>
                    <p className="mt-2 font-semibold text-header">
                      +{formatCurrency(item.extraPrice)}
                    </p>
                  </article>
                ))}
                {configurations.printOptions.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {item.printTypeName}
                    </p>
                    <p className="mt-2 font-semibold text-header">
                      +{formatCurrency(item.extraPrice)}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href="/cart" className="button-primary flex-1">
                Yêu cầu báo giá
              </Link>
              <a href={gmailHref} target="_blank" rel="noreferrer" className="button-secondary flex-1">
                Gửi qua Gmail
              </a>
            </div>
            <ProductPurchasePanel productId={product.id} name={product.name} price={product.price} categoryName={product.categoryName || info.cupType} />
          </div>
        </section>
      </div>
    </div>
  );
}
