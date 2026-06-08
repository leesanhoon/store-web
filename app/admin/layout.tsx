"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { clearAdminAuthenticated } from "@/lib/admin-auth";

const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: "home" },
  { href: "/admin/product", label: "Sản phẩm", icon: "box" },
  { href: "/admin/order", label: "Đơn hàng", icon: "order" },
  { href: "/admin/order?view=quotes", label: "Báo giá", icon: "quote" },
  { href: "/admin/category", label: "Cấu hình", icon: "settings" },
];

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[21px] w-[21px]" aria-hidden="true">
      {name === "home" ? (
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      ) : name === "box" ? (
        <>
          <path d="M6 8.5h12l-1 10H7L6 8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 8.5V7a4 4 0 0 1 8 0v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : name === "order" ? (
        <path d="M8 5h8l2 3v11H6V8l2-3Zm1 7h6m-6 4h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : name === "quote" ? (
        <path d="M7 4h10v16H7V4Zm3 5h4m-4 4h4m-4 4h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M19 13.5v-3l-2-.5a6 6 0 0 0-.7-1.6l1.1-1.8-2.1-2.1-1.8 1.1a6 6 0 0 0-1.6-.7L11.5 3h-3L8 4.9a6 6 0 0 0-1.6.7L4.6 4.5 2.5 6.6l1.1 1.8a6 6 0 0 0-.7 1.6L1 10.5v3l1.9.5c.2.6.4 1.1.7 1.6l-1.1 1.8 2.1 2.1 1.8-1.1c.5.3 1 .5 1.6.7l.5 1.9h3l.5-1.9c.6-.2 1.1-.4 1.6-.7l1.8 1.1 2.1-2.1-1.1-1.8c.3-.5.5-1 .7-1.6l1.9-.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M10 5H6v14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AdminChrome() {
  return (
    <div className="admin-chrome">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <span className="signal-bars">
          <i />
          <i />
          <i />
        </span>
        <span className="wifi-dot" />
        <span className="battery-icon" />
      </span>
    </div>
  );
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const view = searchParams.get("view");

  const logout = () => {
    clearAdminAuthenticated();
    router.replace("/account");
  };

  return (
    <div className="admin-stage">
      <div className="admin-phone">
        <AdminAuthGate>
          <AdminChrome />
          <header className="admin-topbar">
            <button type="button" className="admin-icon-button" aria-label="Đăng xuất" onClick={logout}>
              <LogoutIcon />
            </button>

            <Link href="/admin" className="flex items-center justify-center gap-2 text-[#0b1b3b]">
              <Image src="/images/logo.png" alt="In ly sờ to" width={42} height={26} className="h-6 w-auto object-contain" priority />
              <span className="text-[19px] font-extrabold leading-none tracking-tight">In ly sờ to</span>
            </Link>

            <button type="button" className="admin-icon-button relative" aria-label="Thông báo">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M15 17a3 3 0 0 1-6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M18 16H6c1-1.5 1.5-2.2 1.5-5a4.5 4.5 0 1 1 9 0c0 2.8.5 3.5 1.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#0b1b3b] px-1 text-[10px] font-extrabold text-white">
                3
              </span>
            </button>
          </header>

          <main id="admin-main-content" className="admin-content">
            {children}
          </main>

          <nav className="admin-bottom-nav" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const isQuotes = item.href.includes("view=quotes");
              const isConfig = item.href === "/admin/category";
              const active = isQuotes
                ? pathname === "/admin/order" && view === "quotes"
                : isConfig
                  ? pathname === "/admin/category"
                  : item.href === "/admin"
                    ? pathname === item.href
                    : pathname === item.href && !mode && !view;

              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "active" : undefined}>
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </AdminAuthGate>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
