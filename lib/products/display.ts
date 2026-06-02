import { ProductDto } from "@/lib/api/products";

export type ProductDisplayInfo = {
    cupType: string;
    volume: string;
    unit: string;
    minimumQuantity: string;
    printOption: string;
    icon: string;
};

const VOLUME_PATTERN = /(360|500|700)\s?ml/i;

export function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

export function getProductDisplayInfo(product: Pick<ProductDto, "name" | "description" | "categoryName">): ProductDisplayInfo {
    const text = `${product.name} ${product.description} ${product.categoryName}`.toLowerCase();
    const volume = text.match(VOLUME_PATTERN)?.[0].replace(/\s+/g, "") ?? "Theo mẫu";
    const isPaper = text.includes("giấy") || text.includes("paper");
    const isPet = text.includes("pet");
    const isPp = text.includes("pp");
    const isPrint = text.includes("in") || text.includes("logo");

    return {
        cupType: isPaper ? "Ly giấy" : isPet ? "Ly nhựa PET" : isPp ? "Ly nhựa PP" : "Ly nhựa/giấy",
        volume,
        unit: text.includes("thùng") ? "Thùng" : "Cây hoặc thùng",
        minimumQuantity: isPrint ? "Từ 1.000 ly" : "Từ 1 cây",
        printOption: isPrint ? "Có in logo" : "Có/không in",
        icon: isPaper ? "🥤" : isPrint ? "🎨" : "🥛",
    };
}

export function getFeaturedProducts(products: ProductDto[], limit = 4) {
    return products.slice(0, limit);
}
