import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/mobile-store/HeroSlider";
import MobileCartButton from "@/components/mobile-store/MobileCartButton";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import PartnersSection from "@/components/mobile-store/PartnersSection";
import PopularProductsSection from "@/components/mobile-store/PopularProductsSection";
import Reveal from "@/components/mobile-store/Reveal";
import SaleProductsSection from "@/components/mobile-store/SaleProductsSection";
import {
  BadgeLogoIcon,
  CupIcon,
  LidIcon,
} from "@/components/mobile-store/icons";
import { getCatalogProducts } from "@/lib/data/catalog";

async function loadProducts() {
  try {
    return { products: await getCatalogProducts(), error: "" };
  } catch (error) {
    return {
      products: [],
      error:
        error instanceof Error
          ? error.message
          : "Khong the tai du lieu trang chu.",
    };
  }
}

const categories = [
  { label: "Ly PET", icon: CupIcon, filter: "PET" },
  { label: "Ly PP", icon: CupIcon, filter: "PP" },
  { label: "Ly giay", icon: CupIcon, filter: "Ly giay" },
  { label: "Nap ly", icon: LidIcon, filter: "Nap ly" },
  { label: "In logo", icon: BadgeLogoIcon, filter: "Tat ca" },
];

export default async function Home() {
  const { products, error } = await loadProducts();

  return (
    <MobileAppShell>
      <div className="home-screen">
        <header className="mobile-home-header">
          <Link href="/" className="brand-lockup" aria-label="In ly so to">
            <Image
              src="/images/logo.png"
              alt="In ly so to logo"
              width={44}
              height={44}
              priority
            />
            <span>In ly so to</span>
          </Link>
          <MobileCartButton />
        </header>

        <HeroSlider />

        <Reveal>
          <section className="category-rail" aria-label="Danh muc nhanh">
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
        <Reveal delay={180}>
          <PartnersSection products={products} />
        </Reveal>
      </div>
    </MobileAppShell>
  );
}
