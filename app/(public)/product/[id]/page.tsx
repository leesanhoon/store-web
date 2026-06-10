import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductActions from "@/components/mobile-store/ProductActions";
import ProductCard from "@/components/mobile-store/ProductCard";
import ProductOptionButtons from "@/components/mobile-store/ProductOptionButtons";
import {
  BoxIcon,
  DropletIcon,
  LayersIcon,
  PencilIcon,
} from "@/components/mobile-store/icons";
import type { ProductDto } from "@/lib/api/products";
import { getCompatibleLids } from "@/lib/api/products";
import { getCatalogProduct, getCatalogProducts } from "@/lib/data/catalog";
import {
  formatCurrency,
  formatPriceRange,
  getMinMoq,
  getMinPrice,
  getProductDisplayInfo,
  getProductImageSrc,
  getVariantLabel,
} from "@/lib/products/display";

async function loadProduct(id: string) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId === 0) return null;
  return getCatalogProduct(productId);
}

async function loadRelatedProducts(currentProduct: ProductDto) {
  try {
    const products = await getCatalogProducts();
    return products.filter((product) => product.id !== currentProduct.id).slice(0, 3);
  } catch {
    return [];
  }
}

async function loadCompatibleLids(productId: number) {
  try {
    return await getCompatibleLids(productId);
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const info = getProductDisplayInfo(product);
  const imageSrc = getProductImageSrc(product);
  const minPrice = getMinPrice(product) ?? 0;
  const minMoq = getMinMoq(product);
  const [relatedProducts, compatibleLids] = await Promise.all([
    loadRelatedProducts(product),
    loadCompatibleLids(product.id),
  ]);

  const specs = [
    { label: "Dung tich", value: info.volume, icon: DropletIcon },
    { label: "Chat lieu", value: info.material, icon: LayersIcon },
    { label: "MOQ", value: minMoq ? new Intl.NumberFormat("vi-VN").format(minMoq) : "1.000", icon: BoxIcon },
    { label: "In logo", value: "theo yeu cau", icon: PencilIcon },
  ];

  return (
    <MobileAppShell>
      <div className="product-detail-screen">
        <MobileTopBar
          title="Chi tiet san pham"
          backHref="/products"
          backLabel="Quay lai danh muc"
          rightSlot={<ProductActions productId={product.id} name={product.name} />}
        />

        <section className="detail-hero-image">
          <Image
            src={imageSrc}
            alt={product.name}
            width={760}
            height={560}
            priority
            quality={90}
            className="h-full w-full object-contain"
          />
        </section>

        <section className="detail-product-copy">
          <h2>{product.name}</h2>
          <p className="detail-price">{formatPriceRange(product)}</p>
          <p className="detail-description">{product.description}</p>
        </section>

        <section className="detail-spec-grid" aria-label="Thong so san pham">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <article key={spec.label}>
                <Icon className="h-6 w-6" />
                <span>{spec.label}</span>
                <strong>{spec.value}</strong>
              </article>
            );
          })}
        </section>

        {product.variants.length > 0 ? (
          <section className="detail-section">
            <h3>Biến thể & bảng giá</h3>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-2xl border border-[var(--color-border-soft,#f1e7d8)] bg-[var(--color-surface,#fff)] p-3">
                  <p className="text-[14px] font-extrabold text-[var(--color-ink,#101a36)]">
                    {getVariantLabel(variant)}
                  </p>
                  <div className="mt-2 space-y-1">
                    {variant.priceTiers.map((tier) => (
                      <div key={tier.id} className="flex justify-between text-[13px]">
                        <span className="font-semibold text-[var(--color-ink-muted,#3d4860)]">
                          Từ {new Intl.NumberFormat("vi-VN").format(tier.minQuantity)} ly
                        </span>
                        <span className="font-extrabold text-[var(--color-ink,#101a36)]">
                          {formatCurrency(tier.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {compatibleLids.length > 0 ? (
          <section className="detail-section">
            <h3>Nắp tương thích</h3>
            <div className="space-y-2">
              {compatibleLids.map((lid) => (
                <div key={lid.id} className="rounded-2xl border border-[var(--color-border-soft,#f1e7d8)] bg-[var(--color-surface,#fff)] p-3">
                  <p className="text-[14px] font-extrabold text-[var(--color-ink,#101a36)]">{lid.name}</p>
                  {lid.description ? <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted,#3d4860)]">{lid.description}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lid.prices.map((price) => (
                      <span key={price.id} className="rounded-lg bg-[var(--color-surface-raised,#f8f0e6)] px-2 py-1 text-[11px] font-bold text-[var(--color-ink-muted,#3d4860)]">
                        ⌀{price.diameterMm}mm — {formatCurrency(price.unitPrice)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="detail-section">
          <h3>Tùy chọn</h3>
          <ProductOptionButtons
            productId={product.id}
            name={product.name}
            price={minPrice}
            categoryName={product.categoryName || info.cupType}
            imageSrc={imageSrc}
          />
        </section>

        <section className="detail-section">
          <div className="mobile-section-heading">
            <h3>Sản phẩm liên quan</h3>
            <Link href="/products">Xem tất cả</Link>
          </div>
          {relatedProducts.length === 0 ? (
            <p className="mobile-alert">Chưa có sản phẩm nào.</p>
          ) : (
            <div className="related-products">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} compact />
              ))}
            </div>
          )}
        </section>

        <div className="detail-sticky-cta">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={minPrice}
            categoryName={product.categoryName || info.cupType}
            imageSrc={imageSrc}
            label="Yêu cầu báo giá"
          />
        </div>
      </div>
    </MobileAppShell>
  );
}
