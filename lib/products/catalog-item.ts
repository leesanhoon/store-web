import type { ProductDto } from "@/lib/api/products";

export type CatalogProduct = {
    kind: "product";
    data: ProductDto;
};

export type CatalogLid = {
    kind: "lid";
    data: ProductDto;
};

export type CatalogItem = CatalogProduct | CatalogLid;

export function getCatalogItemImage(item: CatalogItem): string {
    return item.data.avatarImageUrl ?? "/images/ly/coc-nhua-dung-tau-hu-7.png";
}

export function getLidSizes(product: ProductDto): string {
    if (product.variants.length === 0) return "";
    return product.variants.map(v => v.sizeName || `⌀${v.diameterMm}mm`).join(", ");
}
