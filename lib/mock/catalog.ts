import type { CategoryDto } from "@/lib/api/categories";
import type { ProductDto } from "@/lib/api/products";

export type GalleryItem = {
    label: string;
    src: string;
    title: string;
    description: string;
};

export type HomeFeature = {
    title: string;
    description: string;
};

export const mockCategories: CategoryDto[] = [
    {
        id: 1,
        name: "Ly nhựa PET",
        description: "Dòng ly PET trong suốt cho cà phê đá, trà trái cây và cold brew.",
        products: [1, 2],
    },
    {
        id: 2,
        name: "Ly nhựa PP",
        description: "Ly PP dày dặn, phù hợp đồ uống nóng và mang đi số lượng lớn.",
        products: [3],
    },
    {
        id: 3,
        name: "Ly giấy",
        description: "Ly giấy kraft, trắng và giấy phủ PE cho quán cà phê, trà sữa.",
        products: [4, 5],
    },
    {
        id: 4,
        name: "In logo",
        description: "Dịch vụ in thương hiệu, mockup và duyệt mẫu trước sản xuất.",
        products: [6],
    },
];

export const mockProducts: ProductDto[] = [
    {
        id: 1,
        name: "Ly PET 500ml Amber Clear",
        description: "Ly PET 500ml trong, phù hợp cà phê đá, trà trái cây và uống mang đi.",
        price: 620,
        stockQuantity: 12000,
        categoryId: 1,
        categoryName: "Ly nhựa PET",
    },
    {
        id: 2,
        name: "Ly PET 700ml Velvet Clear",
        description: "Ly PET 700ml thân cao, hợp cold brew và trà sữa size lớn.",
        price: 790,
        stockQuantity: 9000,
        categoryId: 1,
        categoryName: "Ly nhựa PET",
    },
    {
        id: 3,
        name: "Ly PP 500ml Heat Safe",
        description: "Ly nhựa PP 500ml cho đồ uống nóng, trà sữa và sữa tươi trân châu.",
        price: 540,
        stockQuantity: 14000,
        categoryId: 2,
        categoryName: "Ly nhựa PP",
    },
    {
        id: 4,
        name: "Ly giấy 360ml Linen Cup",
        description: "Ly giấy 360ml màu kraft, phù hợp americano, latte và take-away.",
        price: 950,
        stockQuantity: 8000,
        categoryId: 3,
        categoryName: "Ly giấy",
    },
    {
        id: 5,
        name: "Ly giấy 500ml Paper Wave",
        description: "Ly giấy 500ml phủ PE, tối ưu cho trà sữa và đồ uống lạnh.",
        price: 1080,
        stockQuantity: 7600,
        categoryId: 3,
        categoryName: "Ly giấy",
    },
    {
        id: 6,
        name: "In logo thương hiệu Urban Brew",
        description: "Dịch vụ in logo trên ly nhựa và ly giấy, kèm mockup duyệt mẫu.",
        price: 2500,
        stockQuantity: 1,
        categoryId: 4,
        categoryName: "In logo",
    },
];

export const mockGalleryItems: GalleryItem[] = [
    {
        label: "Amber Crest 500",
        src: "/images/mockups/pet-500-amber.png",
        title: "Ly PET 500ml",
        description: "Phong cách quán chuỗi, tông caramel, phù hợp đồ uống đá và latte mang đi.",
    },
    {
        label: "Velvet Roast 700",
        src: "/images/mockups/pet-700-velvet.png",
        title: "Ly PET 700ml",
        description: "Thiết kế đậm hơn, nhìn chắc tay, hợp trà sữa cỡ lớn hoặc cold brew.",
    },
    {
        label: "Linen Paper 360",
        src: "/images/mockups/paper-360-linen.png",
        title: "Ly giấy 360ml",
        description: "Trắng - beige nhẹ, tinh gọn, phù hợp americano, cappuccino và take-away.",
    },
    {
        label: "Urban Brew 500",
        src: "/images/mockups/logo-cup-500-urban.png",
        title: "Ly in logo 500ml",
        description: "Tông trung tính, dễ dùng cho nhiều thương hiệu đồ uống hiện đại.",
    },
];

export const mockHomeFeatures: HomeFeature[] = [
    {
        title: "Nguyên liệu an toàn",
        description: "Ly nhựa nguyên sinh và giấy thực phẩm phù hợp đồ uống mang đi.",
    },
    {
        title: "In ấn sắc nét",
        description: "Tư vấn quy cách in logo, màu in và số lượng theo ngân sách.",
    },
    {
        title: "Bán theo cây/thùng",
        description: "Hỗ trợ đặt số lượng nhỏ để dùng thử và số lượng lớn cho chuỗi quán.",
    },
];

