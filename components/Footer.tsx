import React from "react";
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="bg-header text-white pt-24 pb-12 border-t border-gray-100">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 text-center md:text-left">
                    <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-start">
                        <div className="mb-8 flex items-center gap-2">
                            <Image
                                src="/images/logo.png"
                                alt="DTP Logo"
                                width={48}
                                height={48}
                                className="w-10 h-auto brightness-0 invert"
                            />
                            <span className="text-2xl font-black text-white tracking-tighter">
                                DTP
                            </span>
                        </div>
                        <p className="text-white/50 leading-relaxed text-[15px] font-medium max-w-xs">
                            Giải pháp bao bì chuyên nghiệp, kiến tạo thương hiệu
                            đồ uống hiện đại và bền vững tại Quảng Ngãi.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-extrabold mb-8 text-white uppercase tracking-widest text-xs">
                            Giải pháp
                        </h4>
                        <ul className="space-y-5 text-white/60 font-medium">
                            <li>
                                <a
                                    href="/"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Ly nhựa cao cấp
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/products"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Ly giấy bảo vệ môi trường
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/about"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Thiết kế thương hiệu
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-extrabold mb-8 text-white uppercase tracking-widest text-xs">
                            Chính sách
                        </h4>
                        <ul className="space-y-5 text-white/60 font-medium">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Quy trình đặt in
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Vận chuyển tận nơi
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-primary transition-colors text-sm"
                                >
                                    Bảo mật thông tin
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-extrabold mb-8 text-white uppercase tracking-widest text-xs">
                            Kết nối
                        </h4>
                        <div className="space-y-6 text-white/60">
                            <p className="flex items-center justify-center md:justify-start gap-4">
                                <span className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-primary">
                                    ✉
                                </span>
                                <span className="text-sm font-medium">
                                    contact@dtp-packaging.vn
                                </span>
                            </p>
                            <p className="flex items-center justify-center md:justify-start gap-4">
                                <span className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-primary font-bold">
                                    ✆
                                </span>
                                <span className="text-sm font-black text-white">
                                    0900 DTP PACK
                                </span>
                            </p>
                            <p className="flex items-center justify-center md:justify-start gap-4">
                                <span className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-primary">
                                    📍
                                </span>
                                <span className="text-sm font-medium">
                                    Tp. Quảng Ngãi, Tỉnh Quảng Ngãi
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-12 text-center">
                    <p className="text-white/30 text-[11px] font-bold tracking-[0.2em] uppercase">
                        © 2026 DTP Packaging Solutions. Excellence in every
                        package.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
