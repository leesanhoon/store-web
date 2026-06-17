import type { LidDto } from "@/lib/api/lids";
import type { ProductDto } from "@/lib/api/products";
import { formatCurrency } from "@/lib/products/display";

export type CatalogProduct = {
    kind: "product";
    data: ProductDto;
};

export type CatalogLid = {
    kind: "lid";
    data: LidDto;
};

export type CatalogItem = CatalogProduct | CatalogLid;

export function productToCatalogItem(product: ProductDto): CatalogProduct {
    return { kind: "product", data: product };
}

export function lidToCatalogItem(lid: LidDto): CatalogLid {
    return { kind: "lid", data: lid };
}

export function buildCatalogItems(products: ProductDto[], lids: LidDto[]): CatalogItem[] {
    const productItems = products.map(productToCatalogItem);
    const lidItems = lids.map(lidToCatalogItem);
    return [...productItems, ...lidItems];
}

export function getCatalogItemId(item: CatalogItem): string {
    return `${item.kind}-${item.data.id}`;
}

export function getCatalogItemName(item: CatalogItem): string {
    return item.data.name;
}

export function getCatalogItemCategory(item: CatalogItem): string {
    return item.data.categoryName ?? "";
}

export function getCatalogItemImage(item: CatalogItem): string {
    return item.data.avatarImageUrl ?? "/images/ly/coc-nhua-dung-tau-hu-7.png";
}

export function getCatalogItemHref(item: CatalogItem): string {
    if (item.kind === "lid") return `/lid/${item.data.id}`;
    return `/product/${item.data.id}`;
}

export function getLidMinPrice(lid: LidDto): number | null {
    if (lid.prices.length === 0) return null;
    return Math.min(...lid.prices.map((p) => p.unitPrice));
}

export function formatLidPriceRange(lid: LidDto): string {
    const min = getLidMinPrice(lid);
    if (min === null) return "Liên hệ";
    return `Từ ${formatCurrency(min)}`;
}

export function getLidSizes(lid: LidDto): string {
    if (lid.prices.length === 0) return "";
    return lid.prices.map((p) => p.sizeName || `⌀${p.diameterMm}mm`).join(", ");
}
