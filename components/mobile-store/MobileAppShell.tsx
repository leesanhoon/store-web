"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CartIcon,
  GridIcon,
  HomeIcon,
  SearchIcon,
} from "@/components/mobile-store/icons";
import { CART_CHANGED_EVENT, getCartItems } from "@/lib/cart";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/products", label: "Danh mục", icon: GridIcon },
  { href: "/cart", label: "Giỏ hàng", icon: CartIcon, showBadge: true },
  { href: "/track-order", label: "Tra cứu đơn", icon: SearchIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/products") {
    return pathname === "/products" || pathname.startsWith("/product/");
  }

  return pathname === href;
}

export default function MobileAppShell({ children }: Props) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => setCartCount(getCartItems().length);
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="mobile-stage">
      <div className="mobile-phone">
        <div className="mobile-screen">{children}</div>
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? "active" : undefined}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.showBadge && cartCount > 0 && (
                    <span className="nav-cart-badge">{cartCount}</span>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
