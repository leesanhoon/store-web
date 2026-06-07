import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import ProductCard from "@/components/mobile-store/ProductCard";
import {
  BackIcon,
  BoxIcon,
  ChevronRightIcon,
  DropletIcon,
  HeartIcon,
  LayersIcon,
  PencilIcon,
  ShareIcon,
} from "@/components/mobile-store/icons";
import type { ProductDto } from "@/lib/api/products";
import { getCatalogProduct, getCatalogProducts } from "@/lib/data/catalog";
import { demoProducts } from "@/lib/data/demo-products";
import { formatCurrency, getProductDisplayInfo, getProductImageSrc } from "@/lib/products/display";

async function loadProduct(id: string) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId === 0) return null;

  if (productId < 0) {
    return demoProducts.find((product) => product.id === productId) ?? null;
  }

  return getCatalogProduct(productId);
}

async function loadRelatedProducts(currentProduct: ProductDto) {
  try {
    const products = await getCatalogProducts();
    const source = products.length > 0 ? products : demoProducts;
    return source.filter((product) => product.id !== currentProduct.id).slice(0, 3);
  } catch {
    return demoProducts.filter((product) => product.id !== currentProduct.id).slice(0, 3);
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
    { label: "Dung tích", value: info.volume, icon: DropletIcon },
    { label: "Chất liệu", value: info.material, icon: LayersIcon },
    { label: "MOQ", value: "1.000", icon: BoxIcon },
    { label: "In logo", value: "theo yêu cầu", icon: PencilIcon },
  ];

  return (
    <MobileAppShell>
      <div className="product-detail-screen">
        <header className="mobile-topbar detail-topbar">
          <Link href="/products" className="icon-button ghost" aria-label="Quay lại danh mục">
            <BackIcon className="h-6 w-6" />
          </Link>
          <h1>Chi tiết sản phẩm</h1>
          <div className="detail-actions">
            <button type="button" aria-label="Yêu thích">
              <HeartIcon className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Chia sẻ">
              <ShareIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

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
          <p className="detail-price">Từ {formatCurrency(product.price)}</p>
          <p className="detail-description">{product.description}</p>
        </section>

        <section className="detail-spec-grid" aria-label="Thông số sản phẩm">
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
          <h3>Tùy chọn</h3>
          <div className="detail-option-panel">
            <button type="button">
              <span>
                <strong>Loại in</strong>
                <em>Không in, In 1 màu, In nhiều màu</em>
              </span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button type="button">
              <span>
                <strong>Nắp đi kèm</strong>
                <em>Không nắp, Nắp bằng, Nắp cầu</em>
              </span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="detail-section">
          <div className="mobile-section-heading">
            <h3>Sản phẩm liên quan</h3>
            <Link href="/products">Xem tất cả</Link>
          </div>
          <div className="related-products">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} compact />
            ))}
          </div>
        </section>

        <div className="detail-sticky-cta">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={product.price}
            categoryName={product.categoryName || info.cupType}
            imageSrc={imageSrc}
            label="Yêu cầu báo giá"
          />
        </div>
      </div>
    </MobileAppShell>
  );
}
