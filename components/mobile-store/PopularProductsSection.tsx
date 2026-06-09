import Link from "next/link";
import ProductCard from "@/components/mobile-store/ProductCard";
import type { ProductDto } from "@/lib/api/products";

type Props = {
  products: ProductDto[];
};

export default function PopularProductsSection({ products }: Props) {
  return (
    <section className="mobile-section">
      <div className="mobile-section-heading">
        <h2>San pham duoc chon nhieu</h2>
        <Link href="/products">Xem tat ca</Link>
      </div>
      {products.length === 0 ? (
        <p className="mobile-alert">Chua co san pham nao.</p>
      ) : (
        <div className="mobile-product-rail" aria-label="San pham pho bien">
          {products.slice(0, 8).map((product) => (
            <div key={product.id} className="mobile-product-rail-item">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
