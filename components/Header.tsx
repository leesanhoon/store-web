"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, getCartItems } from "@/lib/cart";

const navLinks = [
  { href: "/#categories", label: "Danh mục" },
  { href: "/#best-sellers", label: "Bán chạy" },
  { href: "/#partners", label: "Đối tác" },
  { href: "/#reviews", label: "Feedback" },
  { href: "/#footer", label: "Liên hệ" },
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
    <header className="sticky top-0 z-50 border-b border-[#e7ddd1] bg-white/90 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-3.5">
        <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15" aria-label="Home">
          <Image src="/images/logo.png" alt="Cup Store logo" width={48} height={48} className="h-auto w-10 rounded-xl md:w-11" />
          <div className="min-w-0 leading-tight">
            <span className="font-display block truncate text-lg font-semibold tracking-tight text-header md:text-[1.35rem]">cup store</span>
            <span className="block truncate text-xs font-medium text-slate-500">B2B showroom & printing</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`rounded-full px-4 py-2 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="inline-flex items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-900">
            <span>Cart</span>
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">{cartQuantity}</span>
          </Link>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-white text-slate-700 transition hover:border-slate-900 lg:hidden" onClick={() => setIsMenuOpen((current) => !current)} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-[#e9eef4] bg-white lg:hidden">
          <nav className="page-shell py-4" aria-label="Mobile navigation">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="rounded-2xl border border-[#e5ebf2] bg-slate-50 px-4 py-3 text-base font-semibold text-header transition hover:border-slate-300">
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