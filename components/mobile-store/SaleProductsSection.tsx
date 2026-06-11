import Link from "next/link";
import ProductCard from "@/components/mobile-store/ProductCard";
import type { ProductDto } from "@/lib/api/products";
import { getMinPrice } from "@/lib/products/display";

type Props = {
  products: ProductDto[];
};

export default function SaleProductsSection({ products }: Props) {
  if (products.length === 0) {
    return (
      <section className="mobile-section">
        <div className="mobile-section-heading">
          <h2>Sản phẩm đang giảm giá</h2>
          <Link href="/products">Xem tất cả</Link>
        </div>
        <p className="mobile-alert">Chưa có sản phẩm nào.</p>
      </section>
    );
  }

  const saleProducts = [...products].sort((left, right) => (getMinPrice(left) ?? Infinity) - (getMinPrice(right) ?? Infinity)).slice(0, 6);

  return (
    <section className="mobile-section">
      <div className="mobile-section-heading">
        <h2>Sản phẩm đang giảm giá</h2>
        <Link href="/products">Xem tất cả</Link>
      </div>
      <div className="mobile-product-rail" aria-label="Sản phẩm giá tốt">
        {saleProducts.map((product) => (
          <div key={product.id} className="mobile-product-rail-item">
            <span className="mobile-product-badge">Giá tốt</span>
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
