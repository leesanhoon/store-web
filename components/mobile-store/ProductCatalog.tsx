"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import LidCard from "@/components/mobile-store/LidCard";
import ProductCard from "@/components/mobile-store/ProductCard";
import { useRevealOnScroll } from "@/components/mobile-store/useRevealOnScroll";
import { SearchIcon } from "@/components/mobile-store/icons";
import type { LidDto } from "@/lib/api/lids";
import type { ProductDto } from "@/lib/api/products";
import {
  buildCatalogItems,
  getCatalogItemCategory,
  getCatalogItemId,
  getCatalogItemName,
  type CatalogItem,
} from "@/lib/products/catalog-item";
import { getProductDisplayInfo, normalizeText } from "@/lib/products/display";

type Props = {
  products: ProductDto[];
  lids?: LidDto[];
};

const LID_FILTER = "Nắp ly";

const filters = [
  { label: "Tất cả", match: () => true },
  { label: "PET", match: (cupType: string) => cupType.includes("PET") },
  { label: "PP", match: (cupType: string) => cupType.includes("PP") },
  { label: "Ly giấy", match: (cupType: string) => cupType === "Ly giấy" },
  { label: LID_FILTER, match: (cupType: string) => cupType === LID_FILTER },
];

function resolveInitialFilter(category: string | null) {
  if (!category) return filters[0].label;
  return filters.find((filter) => filter.label === category)?.label ?? filters[0].label;
}

export default function ProductCatalog({ products, lids = [] }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const gridRef = useRevealOnScroll<HTMLElement>();
  const activeFilter = resolveInitialFilter(searchParams.get("category"));

  const catalogItems = useMemo(() => buildCatalogItems(products, lids), [products, lids]);

  const updateFilter = (nextFilter: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextFilter === filters[0].label) {
      nextParams.delete("category");
    } else {
      nextParams.set("category", nextFilter);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const filteredItems = useMemo(() => {
    const filter = filters.find((item) => item.label === activeFilter) ?? filters[0];
    const normalizedQuery = normalizeText(query.trim());
    const isAll = activeFilter === filters[0].label;
    const isLidFilter = activeFilter === LID_FILTER;

    return catalogItems.filter((item) => {
      if (item.kind === "lid") {
        if (!isAll && !isLidFilter) return false;
      } else {
        const cupType = getProductDisplayInfo(item.data).cupType;
        if (!filter.match(cupType)) return false;
      }

      if (!normalizedQuery) return true;
      return normalizeText(`${getCatalogItemName(item)} ${getCatalogItemCategory(item)}`).includes(normalizedQuery);
    });
  }, [catalogItems, activeFilter, query]);

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
            onClick={() => updateFilter(filter.label)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p className="mobile-alert">Không có sản phẩm phù hợp với bộ lọc này.</p>
      ) : (
        <section ref={gridRef} className="catalog-grid reveal" aria-label="Danh sách sản phẩm">
          {filteredItems.map((item) =>
            item.kind === "lid" ? (
              <LidCard key={getCatalogItemId(item)} lid={item.data} />
            ) : (
              <ProductCard key={getCatalogItemId(item)} product={item.data} />
            ),
          )}
        </section>
      )}
    </>
  );
}
