"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/mobile-store/ProductCard";
import type { ProductDto } from "@/lib/api/products";
import { getProductDisplayInfo } from "@/lib/products/display";

type Props = {
  products: ProductDto[];
};

const filters = [
  { label: "Tất cả", match: () => true },
  { label: "PET", match: (cupType: string) => cupType.includes("PET") },
  { label: "PP", match: (cupType: string) => cupType.includes("PP") },
  { label: "Ly giấy", match: (cupType: string) => cupType === "Ly giấy" },
  { label: "Nắp ly", match: (cupType: string) => cupType === "Nắp ly" },
];

export default function ProductCatalog({ products }: Props) {
  const [activeFilter, setActiveFilter] = useState(filters[0].label);

  const filteredProducts = useMemo(() => {
    const filter = filters.find((item) => item.label === activeFilter) ?? filters[0];
    return products.filter((product) => filter.match(getProductDisplayInfo(product).cupType));
  }, [products, activeFilter]);

  return (
    <>
      <div className="filter-pills" aria-label="Bộ lọc sản phẩm">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={filter.label === activeFilter ? "active" : undefined}
            onClick={() => setActiveFilter(filter.label)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="mobile-alert">Không có sản phẩm phù hợp với bộ lọc này.</p>
      ) : (
        <section className="catalog-grid" aria-label="Danh sách sản phẩm">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </>
  );
}
