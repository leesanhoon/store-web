"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  DocumentIcon,
  GridIcon,
  HomeIcon,
  UserIcon,
} from "@/components/mobile-store/icons";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/products", label: "Danh mục", icon: GridIcon },
  { href: "/cart", label: "Yêu cầu", icon: DocumentIcon },
  { href: "/track-order", label: "Đơn hàng", icon: CalendarIcon },
  { href: "/account", label: "Tài khoản", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/products") {
    return pathname === "/products" || pathname.startsWith("/product/");
  }

  return pathname === href;
}

export default function MobileAppShell({ children }: Props) {
  const pathname = usePathname();

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
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
