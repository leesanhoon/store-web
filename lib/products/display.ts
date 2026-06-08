import { ProductDto } from "@/lib/api/products";

export type ProductDisplayInfo = {
  cupType: string;
  volume: string;
  unit: string;
  minimumQuantity: string;
  printOption: string;
  material: string;
  icon: string;
  imageSrc: string;
};

const VOLUME_PATTERN = /(12|16|20)\s?oz|(360|500|700)\s?ml/i;

const fallbackImages = {
  pet: "/images/mockups/pet-500-amber.png",
  pp: "/images/ly/ly-nhua-pp-coc-nhua-pp_500x500.png",
  paper: "/images/mockups/paper-360-linen.png",
  logo: "/images/mockups/logo-cup-500-urban.png",
  lid: "/images/ly/coc-nhua-dung-tau-hu-7.png",
  default: "/images/mockups/hero-cups.png",
};

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(value)}đ`;
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getProductText(product: Pick<ProductDto, "name" | "description" | "categoryName">) {
  return normalizeText(`${product.name} ${product.description ?? ""} ${product.categoryName ?? ""}`);
}

export function getProductImageSrc(
  product: Pick<ProductDto, "name" | "description" | "categoryName" | "avatarImageUrl">,
) {
  if (product.avatarImageUrl) {
    return product.avatarImageUrl;
  }

  const text = getProductText(product);
  if (text.includes("nap")) return fallbackImages.lid;
  if (text.includes("logo") || text.includes("in ")) return fallbackImages.logo;
  if (text.includes("giay") || text.includes("paper")) return fallbackImages.paper;
  if (text.includes("pp")) return fallbackImages.pp;
  if (text.includes("pet")) return fallbackImages.pet;

  return fallbackImages.default;
}

export function formatCurrencyWithSymbol(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductDisplayInfo(
  product: Pick<ProductDto, "name" | "description" | "categoryName" | "avatarImageUrl">,
): ProductDisplayInfo {
  const text = getProductText(product);
  const volume = text.match(VOLUME_PATTERN)?.[0].replace(/\s+/g, "") ?? "500ml";
  const isPaper = text.includes("giay") || text.includes("paper");
  const isPet = text.includes("pet");
  const isPp = text.includes("pp");
  const isLid = text.includes("nap");
  const isPrint = text.includes(" in ") || text.includes("logo");
  const material = isPaper ? "Giấy" : isPp ? "PP" : isPet ? "PET" : isLid ? "PET" : "PET/PP";

  return {
    cupType: isLid ? "Nắp ly" : isPaper ? "Ly giấy" : isPet ? "Ly nhựa PET" : isPp ? "Ly nhựa PP" : "Ly nhựa/giấy",
    volume,
    unit: text.includes("thung") ? "Thùng" : "Cây hoặc thùng",
    minimumQuantity: isPrint ? "Từ 1.000 ly" : "Từ 1.000",
    printOption: isPrint ? "Có in logo" : "Có/không in",
    material,
    icon: isLid ? "N" : isPaper ? "G" : isPrint ? "I" : "C",
    imageSrc: getProductImageSrc(product),
  };
}

export function getFeaturedProducts(products: ProductDto[], limit = 4) {
  return products.slice(0, limit);
}

export function getProductVariantLabels(
  product: Pick<ProductDto, "name" | "description" | "categoryName" | "avatarImageUrl">,
) {
  const info = getProductDisplayInfo(product);

  return [
    { label: "Loại ly", value: info.cupType },
    { label: "Dung tích", value: info.volume },
    { label: "Đơn vị bán", value: info.unit },
    { label: "Tối thiểu", value: info.minimumQuantity },
    { label: "In ấn", value: info.printOption },
  ];
}
