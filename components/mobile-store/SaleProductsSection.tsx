import Link from "next/link";
import ProductCard from "@/components/mobile-store/ProductCard";
import type { ProductDto } from "@/lib/api/products";

type Props = {
  products: ProductDto[];
};

export default function SaleProductsSection({ products }: Props) {
  if (products.length === 0) {
    return (
      <section className="mobile-section">
        <div className="mobile-section-heading">
          <h2>San pham dang giam gia</h2>
          <Link href="/products">Xem tat ca</Link>
        </div>
        <p className="mobile-alert">Chua co san pham nao.</p>
      </section>
    );
  }

  const saleProducts = [...products].sort((left, right) => left.price - right.price).slice(0, 6);

  return (
    <section className="mobile-section">
      <div className="mobile-section-heading">
        <h2>San pham dang giam gia</h2>
        <Link href="/products">Xem tat ca</Link>
      </div>
      <div className="mobile-product-rail" aria-label="San pham gia tot">
        {saleProducts.map((product) => (
          <div key={product.id} className="mobile-product-rail-item">
            <span className="mobile-product-badge">Gia tot</span>
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
