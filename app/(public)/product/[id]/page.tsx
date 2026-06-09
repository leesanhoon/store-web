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
import { getCatalogProduct, getCatalogProducts } from "@/lib/data/catalog";
import { formatCurrency, getProductDisplayInfo, getProductImageSrc } from "@/lib/products/display";

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

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const info = getProductDisplayInfo(product);
  const imageSrc = getProductImageSrc(product);
  const relatedProducts = await loadRelatedProducts(product);

  const specs = [
    { label: "Dung tich", value: info.volume, icon: DropletIcon },
    { label: "Chat lieu", value: info.material, icon: LayersIcon },
    { label: "MOQ", value: "1.000", icon: BoxIcon },
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
          <p className="detail-price">Tu {formatCurrency(product.price)}</p>
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

        <section className="detail-section">
          <h3>Tuy chon</h3>
          <ProductOptionButtons
            productId={product.id}
            name={product.name}
            price={product.price}
            categoryName={product.categoryName || info.cupType}
            imageSrc={imageSrc}
          />
        </section>

        <section className="detail-section">
          <div className="mobile-section-heading">
            <h3>San pham lien quan</h3>
            <Link href="/products">Xem tat ca</Link>
          </div>
          {relatedProducts.length === 0 ? (
            <p className="mobile-alert">Chua co san pham nao.</p>
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
            price={product.price}
            categoryName={product.categoryName || info.cupType}
            imageSrc={imageSrc}
            label="Yeu cau bao gia"
          />
        </div>
      </div>
    </MobileAppShell>
  );
}
