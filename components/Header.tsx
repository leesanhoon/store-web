"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CART_CHANGED_EVENT, getCartItems } from "@/lib/cart";

const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/gallery", label: "Gallery" },
    { href: "/track-order", label: "Tra cứu đơn" },
    { href: "/cart", label: "Báo giá" },
];

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

    return (
        <header className="sticky top-0 z-50 border-b border-[#e5ddd1] bg-white/88 backdrop-blur-xl">
            <div className="page-shell flex items-center justify-between gap-4 py-3.5">
                <Link
                    href="/"
                    className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15"
                    aria-label="Trang chủ DTP Packaging"
                >
                    <Image src="/images/logo.png" alt="DTP Logo" width={48} height={48} className="h-auto w-10 rounded-xl md:w-11" />
                    <div className="min-w-0 leading-tight">
                        <span className="font-display block truncate text-lg font-semibold tracking-tight text-header md:text-[1.35rem]">
                            DTP Packaging
                        </span>
                        <span className="block truncate text-xs font-medium text-slate-500">Ly nhựa, ly giấy, in logo</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
                    {navLinks.map((link) => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={active ? "page" : undefined}
                                className={`rounded-full px-4 py-2 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 ${
                                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/gallery" className="button-secondary hidden sm:inline-flex">
                        Gallery
                    </Link>
                    <Link
                        id="header-cart-link"
                        href="/cart"
                        className="relative rounded-full border border-[#dbcfc0] bg-white p-2.5 text-header transition hover:border-slate-900 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15"
                        aria-label={`Giỏ hàng, ${cartQuantity} sản phẩm`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.25}
                            stroke="currentColor"
                            className="h-5 w-5 md:h-6 md:w-6"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3.75h2.25l2.462 9.469a2.25 2.25 0 002.203 1.781h9.022a2.25 2.25 0 002.203-1.781l1.407-5.406m-15.821 0h17.341c.553 0 1 .447 1 1s-.447 1-1 1H4.179"
                            />
                        </svg>
                        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-semibold text-white shadow-sm">
                            {cartQuantity}
                        </span>
                    </Link>

                    <button
                        className="rounded-full border border-[#dbcfc0] bg-white p-2.5 text-header transition hover:border-slate-900 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 lg:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                        aria-expanded={isMenuOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" className="h-6 w-6">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {isMenuOpen ? (
                <nav className="border-t border-[#e5ddd1] bg-white/95 lg:hidden" aria-label="Điều hướng chính trên di động">
                    <div className="page-shell flex flex-col gap-3 py-4">
                        {navLinks.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`rounded-2xl border px-4 py-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 ${
                                        active
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-[#e5ddd1] bg-slate-50 text-header hover:border-slate-900 hover:bg-white"
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            ) : null}
        </header>
    );
}
