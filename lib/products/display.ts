import { ProductDto } from "@/lib/api/products";

export type ProductDisplayInfo = {
  cupType: string;
  volume: string;
  unit: string;
  minimumQuantity: string;
  printOption: string;
  icon: string;
  imageSrc: string | null;
};

const VOLUME_PATTERN = /(360|500|700)\s?ml/i;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductDisplayInfo(product: Pick<ProductDto, "name" | "description" | "categoryName" | "avatarImageUrl">): ProductDisplayInfo {
  const text = `${product.name} ${product.description ?? ""} ${product.categoryName ?? ""}`.toLowerCase();
  const volume = text.match(VOLUME_PATTERN)?.[0].replace(/\s+/g, "") ?? "Theo mau";
  const isPaper = text.includes("giay") || text.includes("paper");
  const isPet = text.includes("pet");
  const isPp = text.includes("pp");
  const isPrint = text.includes("in") || text.includes("logo");

  return {
    cupType: isPaper ? "Ly giay" : isPet ? "Ly nhua PET" : isPp ? "Ly nhua PP" : "Ly nhua/giay",
    volume,
    unit: text.includes("thung") ? "Thung" : "Cay hoac thung",
    minimumQuantity: isPrint ? "Tu 1.000 ly" : "Tu 1 cay",
    printOption: isPrint ? "Co in logo" : "Co/khong in",
    icon: isPaper ? "P" : isPrint ? "I" : "C",
    imageSrc: product.avatarImageUrl ?? null,
  };
}

export function getFeaturedProducts(products: ProductDto[], limit = 4) {
  return products.slice(0, limit);
}

export function getProductVariantLabels(product: Pick<ProductDto, "name" | "description" | "categoryName" | "avatarImageUrl">) {
  const info = getProductDisplayInfo(product);

  return [
    { label: "Loai ly", value: info.cupType },
    { label: "Dung tich", value: info.volume },
    { label: "Don vi ban", value: info.unit },
    { label: "Toi thieu", value: info.minimumQuantity },
    { label: "In an", value: info.printOption },
  ];
}
