"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProductCard from "@/components/mobile-store/ProductCard";
import { SearchIcon } from "@/components/mobile-store/icons";
import type { ProductDto } from "@/lib/api/products";
import { getProductDisplayInfo, normalizeText } from "@/lib/products/display";

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

function resolveInitialFilter(category: string | null) {
  if (!category) return filters[0].label;
  return filters.find((filter) => filter.label === category)?.label ?? filters[0].label;
}

export default function ProductCatalog({ products }: Props) {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(() =>
    resolveInitialFilter(searchParams.get("category")),
  );
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const filter = filters.find((item) => item.label === activeFilter) ?? filters[0];
    const normalizedQuery = normalizeText(query.trim());

    return products.filter((product) => {
      if (!filter.match(getProductDisplayInfo(product).cupType)) return false;
      if (!normalizedQuery) return true;
      return normalizeText(`${product.name} ${product.categoryName ?? ""}`).includes(normalizedQuery);
    });
  }, [products, activeFilter, query]);

  return (
    <>
      <div className="catalog-search">
        <SearchIcon className="h-5 w-5" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm sản phẩm theo tên..."
          aria-label="Tìm sản phẩm"
        />
      </div>

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
