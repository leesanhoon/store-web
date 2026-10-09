"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { AdminLogoutButton, LogoutIcon } from "@/components/admin/shared";

const adminNav = [
    { href: "/admin", label: "Tổng quan", icon: "home" },
    { href: "/admin/order", label: "Đơn hàng", icon: "order" },
    { href: "/admin/product", label: "Sản phẩm", icon: "box" },
    { href: "/admin/lid", label: "Nắp", icon: "lid" },
    { href: "/admin/partner", label: "Đối tác", icon: "partner" },
    { href: "/admin/category", label: "Danh mục", icon: "grid" },
];

// Below 1024px: the first 4 sections + "Thêm" (the manage hub links the rest and logout)
const mobileNav = [
    ...adminNav.slice(0, 4),
    { href: "/admin/manage", label: "Thêm", icon: "more" },
];

const MORE_ROUTES = ["/admin/manage", "/admin/partner", "/admin/category"];

function isActive(pathname: string, href: string) {
    if (href === "/admin") return pathname === href;
    if (href === "/admin/manage") {
        return MORE_ROUTES.some((route) => pathname.startsWith(route));
    }
    return pathname.startsWith(href);
}

function NavIcon({ name }: { name: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
        >
            {name === "home" ? (
                <path
                    d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                />
            ) : name === "box" ? (
                <>
                    <path
                        d="M6 8.5h12l-1 10H7L6 8.5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M8 8.5V7a4 4 0 0 1 8 0v1.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </>
            ) : name === "order" ? (
                <>
                    <path
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9V5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 12h6M9 16h4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </>
            ) : name === "lid" ? (
                <>
                    <path
                        d="M6 14h12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M7 14c0-4 2.2-7 5-7s5 3 5 7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M5 14v2a1 1 0 001 1h12a1 1 0 001-1v-2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                </>
            ) : name === "partner" ? (
                <>
                    <path
                        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle
                        cx="9"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <path
                        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </>
            ) : name === "grid" ? (
                <>
                    <rect
                        x="3"
                        y="3"
                        width="7"
                        height="7"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="14"
                        y="3"
                        width="7"
                        height="7"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="3"
                        y="14"
                        width="7"
                        height="7"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="14"
                        y="14"
                        width="7"
                        height="7"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                </>
            ) : name === "external" ? (
                <path
                    d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d="M5 12h.01M12 12h.01M19 12h.01"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            )}
        </svg>
    );
}

function AdminLogo() {
    return (
        <Image
            src="/images/logo.png"
            alt=""
            width={49}
            height={32}
            className="h-8 w-auto shrink-0"
            priority
        />
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="admin-shell">
            <a href="#admin-main-content" className="skip-link">
                Bỏ qua tới nội dung chính
            </a>

            <aside className="admin-sidebar">
                <Link href="/admin" className="admin-sidebar-brand">
                    <AdminLogo />
                    <span>Quản trị</span>
                </Link>

                <nav className="admin-sidebar-nav" aria-label="Điều hướng quản trị">
                    {adminNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive(pathname, item.href) ? "page" : undefined}
                            className="admin-sidebar-link"
                        >
                            <NavIcon name={item.icon} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <Link href="/" className="admin-sidebar-link">
                        <NavIcon name="external" />
                        <span>Xem cửa hàng</span>
                    </Link>
                    <AdminLogoutButton className="admin-sidebar-link">
                        <LogoutIcon />
                        <span>Đăng xuất</span>
                    </AdminLogoutButton>
                </div>
            </aside>

            <div className="admin-body">
                <header className="admin-topbar">
                    <Link href="/admin" className="admin-topbar-brand">
                        <AdminLogo />
                        <span>In ly DTP - CN Quảng Ngãi</span>
                    </Link>
                </header>

                <main id="admin-main-content" className="admin-content">
                    {/* Gate only the content so the shell stays visible during the auth check */}
                    <Suspense fallback={null}>
                        <AdminAuthGate>{children}</AdminAuthGate>
                    </Suspense>
                </main>

                <nav className="admin-bottom-nav" aria-label="Điều hướng quản trị">
                    {mobileNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        >
                            <NavIcon name={item.icon} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
