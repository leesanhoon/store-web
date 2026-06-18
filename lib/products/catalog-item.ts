import type { ProductDto } from "@/lib/api/products";
import { formatCurrency } from "@/lib/products/display";

export type CatalogProduct = {
    kind: "product";
    data: ProductDto;
};

export type CatalogLid = {
    kind: "lid";
    data: ProductDto;
};

export type CatalogItem = CatalogProduct | CatalogLid;

export function productToCatalogItem(product: ProductDto): CatalogProduct {
    return { kind: "product", data: product };
}

export function lidToCatalogItem(product: ProductDto): CatalogLid {
    return { kind: "lid", data: product };
}

export function buildCatalogItems(products: ProductDto[], lids: ProductDto[]): CatalogItem[] {
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
    return `/product/${item.data.id}`;
}

export function getLidMinPrice(product: ProductDto): number | null {
    const prices = product.variants.flatMap(v => v.priceTiers.map(t => t.unitPrice));
    if (prices.length === 0) return null;
    return Math.min(...prices);
}

export function formatLidPriceRange(product: ProductDto): string {
    const min = getLidMinPrice(product);
    if (min === null) return "Liên hệ";
    return `Từ ${formatCurrency(min)}`;
}

export function getLidSizes(product: ProductDto): string {
    if (product.variants.length === 0) return "";
    return product.variants.map(v => v.sizeName || `⌀${v.diameterMm}mm`).join(", ");
}
