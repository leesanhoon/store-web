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
import { normalizeText } from "@/lib/products/display";

type CategoryFilter = { id: number; name: string };

type Props = {
    products: ProductDto[];
    lids?: LidDto[];
    categories?: CategoryFilter[];
};

const ALL_FILTER = "Tất cả";

function resolveActiveFilter(
    param: string | null,
    categories: CategoryFilter[],
) {
    if (!param) return ALL_FILTER;
    if (categories.some((c) => c.name === param)) return param;
    return ALL_FILTER;
}

export default function ProductCatalog({
    products,
    lids = [],
    categories = [],
}: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const gridRef = useRevealOnScroll<HTMLElement>();
    const activeFilter = resolveActiveFilter(
        searchParams.get("category"),
        categories,
    );

    const categoryIdsByName = useMemo(() => {
        const map = new Map<string, number>();
        for (const c of categories) map.set(c.name, c.id);
        return map;
    }, [categories]);

    const catalogItems = useMemo(
        () => buildCatalogItems(products, lids),
        [products, lids],
    );

    const updateFilter = (nextFilter: string) => {
        const nextParams = new URLSearchParams(searchParams.toString());

        if (nextFilter === ALL_FILTER) {
            nextParams.delete("category");
        } else {
            nextParams.set("category", nextFilter);
        }

        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
            scroll: false,
        });
    };

    const filteredItems = useMemo(() => {
        const normalizedQuery = normalizeText(query.trim());
        const isAll = activeFilter === ALL_FILTER;
        const activeCategoryId = categoryIdsByName.get(activeFilter);

        return catalogItems.filter((item) => {
            if (!isAll) {
                if (activeCategoryId == null) return false;
                if (item.data.categoryId !== activeCategoryId) return false;
            }

            if (!normalizedQuery) return true;
            return normalizeText(
                `${getCatalogItemName(item)} ${getCatalogItemCategory(item)}`,
            ).includes(normalizedQuery);
        });
    }, [catalogItems, activeFilter, query, categoryIdsByName]);

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
                <button
                    type="button"
                    className={activeFilter === ALL_FILTER ? "active" : undefined}
                    onClick={() => updateFilter(ALL_FILTER)}
                >
                    {ALL_FILTER}
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        className={
                            cat.name === activeFilter ? "active" : undefined
                        }
                        onClick={() => updateFilter(cat.name)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {filteredItems.length === 0 ? (
                <p className="mobile-alert">
                    Không có sản phẩm phù hợp với bộ lọc này.
                </p>
            ) : (
                <section
                    ref={gridRef}
                    className="catalog-grid reveal"
                    aria-label="Danh sách sản phẩm"
                >
                    {filteredItems.map((item) =>
                        item.kind === "lid" ? (
                            <LidCard
                                key={getCatalogItemId(item)}
                                lid={item.data}
                            />
                        ) : (
                            <ProductCard
                                key={getCatalogItemId(item)}
                                product={item.data}
                            />
                        ),
                    )}
                </section>
            )}
        </>
    );
}
