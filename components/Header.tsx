"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/gallery", label: "Gallery" },
    { href: "/track-order", label: "Tra cứu đơn" },
    { href: "/cart", label: "Báo giá" },
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuItems = useMemo(() => navLinks, []);

    return (
        <header className="sticky top-0 z-50 border-b border-[#e6e0d8] bg-white/90 backdrop-blur-xl">
            <div className="page-shell flex items-center justify-between gap-4 py-3.5">
                <Link
                    href="/"
                    className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-50"
                    aria-label="Trang chủ DTP Packaging"
                >
                    <Image
                        src="/images/logo.png"
                        alt="DTP Logo"
                        width={48}
                        height={48}
                        className="h-auto w-10 rounded-xl md:w-11"
                    />
                    <div className="min-w-0 leading-tight">
                        <span className="font-display block truncate text-lg font-semibold tracking-tight text-header md:text-[1.35rem]">
                            DTP Packaging
                        </span>
                        <span className="block truncate text-xs font-medium text-slate-500">Ly nhựa, ly giấy, in logo</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {menuItems.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-full px-4 py-2 text-[15px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/gallery" className="button-secondary hidden sm:inline-flex">
                        Gallery
                    </Link>
                    <Link
                        href="/cart"
                        className="relative rounded-full border border-[#ddd6cb] bg-white p-2.5 text-header transition hover:border-slate-900 hover:text-slate-900"
                        aria-label="Giỏ hàng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" className="h-5 w-5 md:h-6 md:w-6">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3.75h2.25l2.462 9.469a2.25 2.25 0 002.203 1.781h9.022a2.25 2.25 0 002.203-1.781l1.407-5.406m-15.821 0h17.341c.553 0 1 .447 1 1s-.447 1-1 1H4.179"
                            />
                        </svg>
                        <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-accent text-[9px] font-semibold text-white shadow-sm md:h-4 md:w-4 md:text-[10px]">
                            0
                        </span>
                    </Link>

                    <button
                        className="rounded-full border border-[#ddd6cb] bg-white p-2.5 text-header transition hover:border-slate-900 hover:text-slate-900 focus:outline-none lg:hidden"
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
                <nav className="border-t border-[#e6e0d8] bg-white/95 lg:hidden">
                    <div className="page-shell flex flex-col gap-3 py-4">
                        {menuItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-2xl border border-[#e6e0d8] bg-slate-50 px-4 py-3 text-base font-semibold text-header transition hover:border-slate-900 hover:bg-white"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            ) : null}
        </header>
    );
}
