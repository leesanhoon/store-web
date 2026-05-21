"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Trang chủ" },
        { href: "/products", label: "Sản phẩm" },
        { href: "/about", label: "Giới thiệu" },
        { href: "/contact", label: "Liên hệ" },
    ];

    return (
        <header className="bg-surface/90 shadow-soft sticky top-0 z-50 backdrop-blur-md border-b border-brand-emerald/10">
            <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                {/* Logo Section */}
                <Link
                    href="/"
                    className="group flex items-center gap-2 outline-none"
                    aria-label="Trang chủ DTP"
                >
                    <Image
                        src="/images/logo.png"
                        alt="DTP Logo"
                        width={48}
                        height={48}
                        className="w-10 h-auto md:w-12"
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-brand-forest font-semibold hover:text-brand-emerald transition-colors duration-300"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Action Icons & Mobile Menu Toggle */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    <button
                        className="p-2 text-brand-forest hover:text-brand-emerald transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 rounded-lg"
                        aria-label="Tìm kiếm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 md:w-6 md:h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                    </button>
                    <Link
                        href="/cart"
                        className="p-2 text-brand-forest hover:text-brand-emerald transition-colors duration-300 relative focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 rounded-lg"
                        aria-label="Giỏ hàng"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 md:w-6 md:h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3.75h2.25l2.462 9.469a2.25 2.25 0 002.203 1.781h9.022a2.25 2.25 0 002.203-1.781l1.407-5.406m-15.821 0h17.341c.553 0 1 .447 1 1s-.447 1-1 1H4.179"
                            />
                        </svg>
                        <span className="absolute top-1 right-1 bg-brand-emerald text-white text-[9px] md:text-[10px] font-bold rounded-full h-3.5 w-3.5 md:h-4 md:w-4 flex items-center justify-center shadow-sm">
                            0
                        </span>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-brand-forest hover:text-brand-emerald transition-colors focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                        aria-expanded={isMenuOpen}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <nav className="md:hidden bg-white border-t border-brand-emerald/10 animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col py-4 px-6 space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-brand-forest font-bold text-lg hover:text-brand-emerald transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            )}
        </header>
    );
};

export default Header;
