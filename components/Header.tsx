import React from "react";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
    return (
        <header className="bg-surface/90 shadow-soft sticky top-0 z-50 backdrop-blur-md border-b border-brand-emerald/10">
            <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                <Link
                    href="/"
                    className="group flex items-center gap-2"
                    aria-label="Trang chủ DTP"
                >
                    <Image
                        src="/images/logo.png"
                        alt="DTP Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                    />
                </Link>
                <nav className="hidden md:flex items-center space-x-8">
                    <Link
                        href="/"
                        className="text-brand-forest font-semibold hover:text-brand-emerald transition-colors duration-300"
                    >
                        Trang chủ
                    </Link>
                    <Link
                        href="/products"
                        className="text-brand-forest font-semibold hover:text-brand-emerald transition-colors duration-300"
                    >
                        Sản phẩm
                    </Link>
                    <Link
                        href="/about"
                        className="text-brand-forest font-semibold hover:text-brand-emerald transition-colors duration-300"
                    >
                        Giới thiệu
                    </Link>
                    <Link
                        href="/contact"
                        className="text-brand-forest font-semibold hover:text-brand-emerald transition-colors duration-300"
                    >
                        Liên hệ
                    </Link>
                </nav>
                <div className="flex items-center space-x-4">
                    <button
                        className="p-2 text-brand-forest hover:text-brand-emerald transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 rounded-lg"
                        aria-label="Tìm kiếm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
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
                        className="p-2 text-brand-forest hover:text-brand-emerald transition-colors duration-300 relative focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 rounded-lg"
                        aria-label="Giỏ hàng"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3.75h2.25l2.462 9.469a2.25 2.25 0 002.203 1.781h9.022a2.25 2.25 0 002.203-1.781l1.407-5.406m-15.821 0h17.341c.553 0 1 .447 1 1s-.447 1-1 1H4.179"
                            />
                        </svg>
                        <span className="absolute top-0 right-0 bg-brand-emerald text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                            0
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
