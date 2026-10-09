"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProductCard from "@/components/mobile-store/ProductCard";
import { SearchIcon } from "@/components/mobile-store/icons";
import type { ProductDto } from "@/lib/api/products";
import { normalizeText } from "@/lib/products/display";
import { SITE } from "@/lib/site";

type CategoryFilter = { id: number; name: string };

type Props = {
    products: ProductDto[];
    lids?: ProductDto[];
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
    const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
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
        () => [...products, ...lids],
        [products, lids],
    );

    /** Current URL with some params set (non-empty value) or removed. */
    const hrefWith = (updates: Record<string, string>) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value) nextParams.set(key, value);
            else nextParams.delete(key);
        }
        const nextQuery = nextParams.toString();
        return nextQuery ? `${pathname}?${nextQuery}` : pathname;
    };

    const updateFilter = (nextFilter: string) => {
        router.replace(
            hrefWith({ category: nextFilter === ALL_FILTER ? "" : nextFilter }),
            { scroll: false },
        );
    };

    const updateQuery = (nextQuery: string) => {
        setQuery(nextQuery);
        // Native replaceState keeps useSearchParams in sync without a server
        // round trip; router.replace would refetch this dynamic page per keystroke.
        window.history.replaceState(null, "", hrefWith({ q: nextQuery.trim() }));
    };

    const clearFilters = () => {
        setQuery("");
        router.replace(hrefWith({ q: "", category: "" }), { scroll: false });
    };

    const filteredItems = useMemo(() => {
        const normalizedQuery = normalizeText(query.trim());
        const isAll = activeFilter === ALL_FILTER;
        const activeCategoryId = categoryIdsByName.get(activeFilter);

        return catalogItems.filter((item) => {
            if (!isAll) {
                if (activeCategoryId == null) return false;
                if (item.categoryId !== activeCategoryId) return false;
            }

            if (!normalizedQuery) return true;
            return normalizeText(
                `${item.name} ${item.categoryName ?? ""}`,
            ).includes(normalizedQuery);
        });
    }, [catalogItems, activeFilter, query, categoryIdsByName]);

    return (
        <div className="catalog-layout">
            <div className="catalog-sidebar">
                <label className="catalog-search">
                    <SearchIcon className="h-5 w-5 shrink-0" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => updateQuery(event.target.value)}
                        placeholder="Tìm sản phẩm theo tên..."
                        aria-label="Tìm sản phẩm"
                    />
                </label>

                <div
                    className="filter-pills"
                    role="group"
                    aria-label="Lọc theo danh mục"
                >
                    <button
                        type="button"
                        aria-pressed={activeFilter === ALL_FILTER}
                        onClick={() => updateFilter(ALL_FILTER)}
                    >
                        {ALL_FILTER}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            aria-pressed={cat.name === activeFilter}
                            onClick={() => updateFilter(cat.name)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="catalog-results">
                <p className="catalog-count" aria-live="polite">
                    {filteredItems.length} sản phẩm
                </p>

                {filteredItems.length === 0 ? (
                    <div className="mobile-alert catalog-empty">
                        <p>Không có sản phẩm phù hợp với bộ lọc này.</p>
                        <div className="catalog-empty-actions">
                            <button
                                type="button"
                                className="button-primary"
                                onClick={clearFilters}
                            >
                                Xóa bộ lọc
                            </button>
                            <a
                                href={SITE.zaloHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-secondary"
                            >
                                Nhắn Zalo tư vấn
                            </a>
                        </div>
                    </div>
                ) : (
                    <section
                        className="catalog-grid"
                        aria-label="Danh sách sản phẩm"
                    >
                        {filteredItems.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}
