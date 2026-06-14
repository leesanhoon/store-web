"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useState, useCallback, useEffect, useRef } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { clearAdminAuthenticated } from "@/lib/admin-auth";

const adminNav = [
    { href: "/admin", label: "Tổng quan", icon: "home" },
    { href: "/admin/product", label: "Sản phẩm", icon: "box" },
    { href: "/admin/order", label: "Đơn hàng", icon: "order" },
    { href: "/admin/manage", label: "Quản lý", icon: "grid" },
];

const fabActions = [
    { href: "/admin/product?mode=create", label: "Sản phẩm", icon: "box" },
    { href: "/admin/lid?mode=create", label: "Nắp", icon: "lid" },
    { href: "/admin/partner?mode=create", label: "Đối tác", icon: "partner" },
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
                    <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                </>
            ) : (
                <>
                    <path
                        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
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
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            aria-hidden="true"
        >
            <path
                d="M10 5H6v14h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M18 12H9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function AdminFAB() {
    const [open, setOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const toggle = useCallback(() => setOpen((v) => !v), []);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleAction = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <div ref={fabRef} className="admin-fab-container">
            {/* Backdrop */}
            <div
                className={`admin-fab-backdrop ${open ? "open" : ""}`}
                onClick={() => setOpen(false)}
            />

            {/* Action items */}
            <div className={`admin-fab-menu ${open ? "open" : ""}`}>
                {fabActions.map((action, i) => (
                    <button
                        key={action.href}
                        type="button"
                        className="admin-fab-action"
                        style={{ transitionDelay: open ? `${i * 50}ms` : "0ms" }}
                        onClick={() => handleAction(action.href)}
                    >
                        <span className="admin-fab-action-icon">
                            <NavIcon name={action.icon} />
                        </span>
                        <span className="admin-fab-action-label">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* FAB button */}
            <button
                type="button"
                className={`admin-fab-btn ${open ? "open" : ""}`}
                onClick={toggle}
                aria-label={open ? "Đóng" : "Tạo mới"}
            >
                <svg viewBox="0 0 24 24" fill="none" className="admin-fab-icon">
                    <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
        </div>
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
                        <button
                            type="button"
                            className="admin-icon-button"
                            aria-label="Đăng xuất"
                            onClick={logout}
                        >
                            <LogoutIcon />
                        </button>

                        <Link
                            href="/admin"
                            className="flex items-center justify-center gap-2 text-[#101a36]"
                        >
                            <Image
                                src="/images/logo.png"
                                alt="In ly DTP Quảng Ngãi"
                                width={42}
                                height={26}
                                className="h-6 w-auto object-contain"
                                priority
                            />
                            <span className="text-[19px] font-extrabold leading-none tracking-tight">
                                In ly DTP Quảng Ngãi
                            </span>
                        </Link>

                        <span className="admin-icon-button" aria-hidden="true" />
                    </header>

                    <main id="admin-main-content" className="admin-content">
                        {children}
                    </main>

                    <AdminFAB />

                    <nav
                        className="admin-bottom-nav"
                        aria-label="Admin navigation"
                    >
                        {adminNav.map((item) => {
                            const manageRoutes = ["/admin/lid", "/admin/partner", "/admin/category"];
                            const active =
                                item.href === "/admin"
                                    ? pathname === item.href
                                    : item.href === "/admin/manage"
                                      ? manageRoutes.some((r) => pathname.startsWith(r)) || pathname === "/admin/manage"
                                      : pathname.startsWith(item.href) && !mode;

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
