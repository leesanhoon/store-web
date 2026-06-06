import Image from "next/image";
import Link from "next/link";
import MobileCartButton from "@/components/mobile-store/MobileCartButton";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import ProductCard from "@/components/mobile-store/ProductCard";
import { BadgeLogoIcon, CupIcon, LidIcon } from "@/components/mobile-store/icons";
import { getCatalogProducts } from "@/lib/data/catalog";
import { demoProducts } from "@/lib/data/demo-products";

async function loadProducts() {
  try {
    return { products: await getCatalogProducts(), error: "" };
  } catch (error) {
    return {
      products: [],
      error: error instanceof Error ? error.message : "Không thể tải dữ liệu trang chủ.",
    };
  }
}

const categories = [
  { label: "Ly PET", icon: CupIcon },
  { label: "Ly PP", icon: CupIcon },
  { label: "Ly giấy", icon: CupIcon },
  { label: "Nắp ly", icon: LidIcon },
  { label: "In logo", icon: BadgeLogoIcon },
];

export default async function Home() {
  const { products, error } = await loadProducts();
  const displayProducts = products.length > 0 ? products : demoProducts;
  const featuredProducts = displayProducts.slice(0, 3);

  return (
    <MobileAppShell>
      <div className="home-screen">
        <header className="mobile-home-header">
          <Link href="/" className="brand-lockup" aria-label="Cup Store">
            <Image src="/images/logo.png" alt="Cup Store logo" width={44} height={44} priority />
            <span>Cup Store</span>
          </Link>
          <MobileCartButton />
        </header>

        <section className="mobile-hero-card">
          <div className="mobile-hero-copy">
            <h1>Ly nhựa & in logo cho quán coffee</h1>
            <p>Chọn mẫu ly phù hợp, gửi logo của bạn và nhận báo giá nhanh chóng trong 24h.</p>
            <div className="mobile-hero-actions">
              <Link href="/products" className="mobile-cta primary">
                Xem sản phẩm
              </Link>
              <Link href="/cart" className="mobile-cta secondary">
                Yêu cầu báo giá
              </Link>
            </div>
          </div>
          <Image
            src="/images/mockups/hero-cups.png"
            alt="Các mẫu ly cà phê có in logo"
            width={760}
            height={760}
            className="mobile-hero-image"
            priority
          />
        </section>

        <section className="category-rail" aria-label="Danh mục nhanh">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.label} href="/products" className="category-tile">
                <Icon className="h-7 w-7" />
                <span>{category.label}</span>
              </Link>
            );
          })}
        </section>

        <section className="mobile-section">
          <div className="mobile-section-heading">
            <h2>Sản phẩm nổi bật</h2>
            <Link href="/products">Xem tất cả</Link>
          </div>

          {error ? <p className="mobile-alert">{error}</p> : null}
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      </div>
    </MobileAppShell>
  );
}
