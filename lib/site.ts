/**
 * Thông tin liên hệ và công tắc hiển thị dùng chung cho header, footer, giỏ hàng và trang sản phẩm.
 * Trường để trống ("") thì không hiển thị.
 * Các biến NEXT_PUBLIC_* phải được truy cập trực tiếp (không dùng khóa động) để Next.js nhúng vào bundle client lúc build.
 */
export const SITE = {
  name: "In ly DTP - CN Quảng Ngãi",
  tagline: "In Ly Thả Ga - Không Lo Về Giá",
  phoneDisplay: "0905 123 456", // TODO(user): xác nhận số thật
  phoneHref: "tel:0905123456", // TODO(user): xác nhận số thật
  zaloHref: "https://zalo.me/0905123456", // TODO(user): xác nhận số thật
  address: "", // TODO(user): địa chỉ chi nhánh Quảng Ngãi
  hours: "", // TODO(user): giờ mở cửa
  legalName: "", // TODO(user): tên pháp lý của chi nhánh Quảng Ngãi
  email: "", // TODO(user): email liên hệ
  facebookUrl: "", // TODO(user): trang Facebook của chi nhánh Quảng Ngãi
  tiktokUrl: "", // TODO(user): kênh TikTok (nếu có)
  youtubeUrl: "", // TODO(user): kênh YouTube (nếu có)
  mapUrl: "", // TODO(user): liên kết Google Maps của chi nhánh
  // Tên miền riêng của site (vd. https://example.vn), bỏ dấu "/" cuối; dùng cho canonical, sitemap, JSON-LD.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, ""),
  // Mặc định ẩn giá toàn storefront; chỉ bật khi NEXT_PUBLIC_SHOW_PRICES=true. Admin không bị ảnh hưởng.
  showPrices: process.env.NEXT_PUBLIC_SHOW_PRICES === "true",
};

export const PRICE_HIDDEN_LABEL = "Liên hệ để nhận báo giá";
