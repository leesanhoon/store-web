"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, Suspense } from "react";

const adminNav = [
    { href: "/admin", label: "Tổng quan", icon: "home" },
    { href: "/admin/product", label: "Sản phẩm", icon: "box" },
    { href: "/admin/order", label: "Đơn hàng", icon: "order" },
    { href: "/admin/order?view=quotes", label: "Báo giá", icon: "quote" },
    // { href: "/admin/product?mode=create", label: "Thêm", icon: "plus" },
];

function NavIcon({ name }: { name: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[21px] w-[21px]"
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
                <path
                    d="M8 5h8l2 3v11H6V8l2-3Zm1 7h6m-6 4h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : name === "quote" ? (
                <path
                    d="M7 4h10v16H7V4Zm3 5h4m-4 4h4m-4 4h2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                />
            )}
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
    const mode = searchParams.get("mode");
    const view = searchParams.get("view");

    return (
        <div className="admin-stage">
            <div className="admin-phone">
                <AdminChrome />
                <header className="admin-topbar">
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Mở menu"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path
                                d="M4 7h16M4 12h16M4 17h16"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>

                    <Link
                        href="/admin"
                        className="flex items-center justify-center gap-2 text-[#0b1b3b]"
                    >
                        <Image
                            src="/images/logo.png"
                            alt="In ly sờ to"
                            width={42}
                            height={26}
                            className="h-6 w-auto object-contain"
                            priority
                        />
                        <span className="text-[19px] font-extrabold leading-none tracking-tight">
                            In ly sờ to
                        </span>
                    </Link>

                    <button
                        type="button"
                        className="admin-icon-button relative"
                        aria-label="Thông báo"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path
                                d="M15 17a3 3 0 0 1-6 0"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                            <path
                                d="M18 16H6c1-1.5 1.5-2.2 1.5-5a4.5 4.5 0 1 1 9 0c0 2.8.5 3.5 1.5 5Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                            />
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
                        const isCreate = item.href.includes("mode=create");
                        const isQuotes = item.href.includes("view=quotes");
                        const active = isCreate
                            ? pathname === "/admin/product" && mode === "create"
                            : isQuotes
                              ? pathname === "/admin/order" && view === "quotes"
                              : item.href === "/admin"
                                ? pathname === item.href
                                : pathname === item.href && !mode && !view;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={active ? "active" : undefined}
                            >
                                <NavIcon name={item.icon} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
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
