import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/mobile-store/HeroSlider";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import PartnersSection from "@/components/mobile-store/PartnersSection";
import PopularProductsSection from "@/components/mobile-store/PopularProductsSection";
import Reveal from "@/components/mobile-store/Reveal";
import SaleProductsSection from "@/components/mobile-store/SaleProductsSection";
import TrustStrip from "@/components/mobile-store/TrustStrip";
import {
  BadgeLogoIcon,
  CupIcon,
  LidIcon,
} from "@/components/mobile-store/icons";
import { getCatalogProducts } from "@/lib/data/catalog";
import { getCatalogPartners } from "@/lib/data/partners";

async function loadProducts() {
  try {
    return { products: await getCatalogProducts(), error: "" };
  } catch (error) {
    return {
      products: [],
      error:
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu trang chủ.",
    };
  }
}

async function loadPartners() {
  try {
    return await getCatalogPartners();
  } catch {
    return [];
  }
}

const categories = [
  { label: "Ly PET", icon: CupIcon, filter: "PET" },
  { label: "Ly PP", icon: CupIcon, filter: "PP" },
  { label: "Ly giấy", icon: CupIcon, filter: "Ly giấy" },
  { label: "Nắp ly", icon: LidIcon, filter: "Nắp ly" },
  { label: "In logo", icon: BadgeLogoIcon, filter: "Tất cả" },
];

export default async function Home() {
  await connection();
  const [{ products, error }, partners] = await Promise.all([
    loadProducts(),
    loadPartners(),
  ]);

  return (
    <MobileAppShell>
      <div className="home-screen">
        <header className="mobile-home-header">
          <Link href="/" className="brand-lockup" aria-label="In ly DTP Quảng Ngãi">
            <Image
              src="/images/logo.png"
              alt="In ly DTP Quảng Ngãi"
              width={44}
              height={44}
              priority
            />
            <span>In ly DTP Quảng Ngãi</span>
          </Link>
        </header>

        <div className="promo-strip" aria-label="Khuyến mãi">
          <span className="promo-strip-dot" aria-hidden="true" />
          <p>Miễn phí thiết kế logo &bull; Giao hàng toàn quốc</p>
        </div>

        <HeroSlider />

        <Reveal>
          <section className="category-rail" aria-label="Danh mục nhanh">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.label}
                  href={`/products?category=${encodeURIComponent(category.filter)}`}
                  className="category-tile"
                >
                  <Icon className="h-7 w-7" />
                  <span>{category.label}</span>
                </Link>
              );
            })}
          </section>
        </Reveal>

        {error ? <p className="mobile-alert">{error}</p> : null}

        <Reveal delay={60}>
          <SaleProductsSection products={products} />
        </Reveal>
        <Reveal delay={120}>
          <PopularProductsSection products={products} />
        </Reveal>
        <Reveal delay={160}>
          <TrustStrip />
        </Reveal>
        <Reveal delay={200}>
          <PartnersSection partners={partners} />
        </Reveal>
      </div>
    </MobileAppShell>
  );
}
