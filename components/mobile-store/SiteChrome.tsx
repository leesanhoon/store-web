"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarIcon,
  CartIcon,
  ChatIcon,
  GridIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
} from "@/components/mobile-store/icons";
import { SITE } from "@/lib/site";
import { useCartItems } from "@/lib/use-cart";

const headerLinks = [
  { href: "/products", label: "Sản phẩm" },
  { href: "/gallery", label: "Mẫu thực tế" },
  { href: "/track-order", label: "Tra cứu đơn" },
];

const bottomNavItems = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/products", label: "Sản phẩm", icon: GridIcon },
  { href: "/cart", label: "Giỏ hàng", icon: CartIcon },
  { href: "/track-order", label: "Tra cứu", icon: SearchIcon },
];

const productLinks = [
  { href: "/products", label: "Tất cả sản phẩm" },
  { href: { pathname: "/products", query: { category: "Nắp ly" } }, label: "Nắp ly" },
  { href: "/cart", label: "Giỏ hàng" },
];

const supportLinks = [
  { href: "/track-order", label: "Tra cứu đơn" },
  { href: "/gallery", label: "Mẫu thực tế" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/products" && pathname.startsWith("/product/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CartBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="nav-cart-badge" aria-hidden="true">
      {count}
    </span>
  ) : null;
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cartCount = useCartItems()?.length ?? 0;
  const cartLabel = cartCount > 0 ? `Giỏ hàng (${cartCount})` : "Giỏ hàng";
  const currentFor = (href: string) => (isActive(pathname, href) ? "page" : undefined);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Bỏ qua tới nội dung chính
      </a>

      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link href="/" className="site-logo">
            <Image
              src="/images/logo.png"
              alt={SITE.name}
              width={962}
              height={628}
              sizes="64px"
              priority
              className="h-8 w-auto md:h-10"
            />
          </Link>

          <nav className="site-nav" aria-label="Điều hướng chính">
            {headerLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={currentFor(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-header-actions">
            {SITE.phoneHref ? (
              <a href={SITE.phoneHref} className="site-hotline" aria-label={`Gọi hotline ${SITE.phoneDisplay}`}>
                <PhoneIcon className="h-5 w-5" />
                {SITE.phoneDisplay}
              </a>
            ) : null}
            <Link
              href="/cart"
              className="icon-button ghost site-cart"
              aria-label={cartLabel}
              aria-current={currentFor("/cart")}
            >
              <span className="relative">
                <CartIcon className="h-6 w-6" />
                <CartBadge count={cartCount} />
              </span>
            </Link>
            {SITE.zaloHref ? (
              <>
                <a
                  href={SITE.zaloHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-button ghost site-zalo"
                  aria-label="Chat Zalo"
                >
                  <ChatIcon className="h-6 w-6" />
                </a>
                <a
                  href={SITE.zaloHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-primary site-quote-cta"
                >
                  Nhận báo giá
                </a>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main-content" className="site-main">
        {children}
      </main>

      <footer className="site-footer on-dark">
        <div className="site-container site-footer-grid">
          <div>
            <p className="site-footer-name">{SITE.name}</p>
            <p>{SITE.tagline}</p>
          </div>

          <div>
            <h2>Sản phẩm</h2>
            <ul className="site-footer-list">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Hỗ trợ</h2>
            <ul className="site-footer-list">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Liên hệ</h2>
            <ul className="site-footer-list">
              {SITE.phoneHref ? (
                <li>
                  <a href={SITE.phoneHref}>
                    <PhoneIcon className="h-5 w-5" />
                    {SITE.phoneDisplay}
                  </a>
                </li>
              ) : null}
              {SITE.zaloHref ? (
                <li>
                  <a href={SITE.zaloHref} target="_blank" rel="noopener noreferrer">
                    <ChatIcon className="h-5 w-5" />
                    Chat Zalo
                  </a>
                </li>
              ) : null}
              {SITE.address ? (
                <li>
                  <MapPinIcon className="h-5 w-5" />
                  {SITE.address}
                </li>
              ) : null}
              {SITE.hours ? (
                <li>
                  <CalendarIcon className="h-5 w-5" />
                  {SITE.hours}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isCart = item.href === "/cart";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={currentFor(item.href)}
              aria-label={isCart ? cartLabel : undefined}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {isCart ? <CartBadge count={cartCount} /> : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
