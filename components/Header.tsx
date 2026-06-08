"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, getCartItems } from "@/lib/cart";

const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Danh mục" },
    { href: "/admin", label: "Admin" },
];

function isMobileMockupRoute(pathname: string) {
    return (
        pathname === "/" ||
        pathname === "/products" ||
        pathname === "/cart" ||
        pathname === "/account" ||
        pathname === "/track-order" ||
        pathname.startsWith("/product/")
    );
}

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartQuantity, setCartQuantity] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const syncCartQuantity = () => setCartQuantity(getCartItems().length);
        syncCartQuantity();
        window.addEventListener(CART_CHANGED_EVENT, syncCartQuantity);
        window.addEventListener("storage", syncCartQuantity);
        return () => {
            window.removeEventListener(CART_CHANGED_EVENT, syncCartQuantity);
            window.removeEventListener("storage", syncCartQuantity);
        };
    }, []);

    if (isMobileMockupRoute(pathname)) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 border-b border-[#eadfce] bg-white/90 backdrop-blur-xl">
            <div className="page-shell flex h-16 items-center justify-between gap-3">
                <Link
                    href="/"
                    className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15"
                    aria-label="Trang chủ"
                >
                    <Image
                        src="/images/logo.png"
                        alt="In ly sờ to logo"
                        width={48}
                        height={48}
                        className="h-auto w-10 rounded-xl md:w-11"
                    />
                    <div className="min-w-0 leading-tight">
                        <span className="font-display block truncate text-lg font-semibold tracking-tight text-header md:text-[1.35rem]">
                            In ly sờ to
                        </span>
                        <span className="block truncate text-xs font-medium text-slate-500">
                            ly in logo theo yêu cầu
                        </span>
                    </div>
                </Link>

                <nav
                    className="hidden items-center gap-1 md:flex"
                    aria-label="Main navigation"
                >
                    {navLinks.map((link) => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={active ? "page" : undefined}
                                className={`rounded-full px-4 py-2 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 ${
                                    active
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {isMenuOpen ? (
                <div className="border-t border-[#eadfce] bg-white md:hidden">
                    <nav
                        className="page-shell py-4"
                        aria-label="Mobile navigation"
                    >
                        <div className="grid gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="rounded-2xl border border-[#eadfce] bg-slate-50 px-4 py-3 text-base font-semibold text-header transition hover:border-slate-300"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>
            ) : null}
        </header>
    );
}
