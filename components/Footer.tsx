import React from "react";
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="bg-brand-forest text-brand-light pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 text-center md:text-left">
                    <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-start">
                        <div className="mb-6 flex items-center gap-2">
                            <Image
                                src="/images/logo.png"
                                alt="DTP Logo"
                                width={40}
                                height={40}
                                className="w-10 h-auto brightness-0 invert"
                            />
                        </div>
                        <p className="text-brand-sage/60 leading-relaxed text-sm max-w-xs">
                            DTP - Giải pháp bao bì chuyên nghiệp nâng tầm thương
                            hiệu đồ uống Việt với sứ mệnh đổi mới và bền vững
                            tại Quảng Ngãi.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
                            Liên kết
                        </h4>
                        <ul className="space-y-4 text-brand-sage/70">
                            <li>
                                <a
                                    href="/"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Trang chủ
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/products"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Sản phẩm
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/about"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Giới thiệu
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
                            Hỗ trợ
                        </h4>
                        <ul className="space-y-4 text-brand-sage/70">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Chính sách chất lượng
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Quy trình đặt in
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-sage transition-colors text-sm"
                                >
                                    Báo giá sỉ
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase tracking-wider text-sm">
                            Liên hệ
                        </h4>
                        <div className="space-y-4 text-brand-sage/70">
                            <p className="flex items-center justify-center md:justify-start gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                                    ✉
                                </span>
                                <span className="text-sm">
                                    contact@dtp-packaging.vn
                                </span>
                            </p>
                            <p className="flex items-center justify-center md:justify-start gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                                    ✆
                                </span>
                                <span className="text-sm font-bold text-white">
                                    0900 DTP PACK
                                </span>
                            </p>
                            <p className="flex items-center justify-center md:justify-start gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                                    📍
                                </span>
                                <span className="text-sm">
                                    Tp. Quảng Ngãi, Tỉnh Quảng Ngãi
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-brand-emerald/20 pt-8 text-center text-brand-sage/40 text-xs tracking-widest uppercase px-4">
                    <p>
                        © 2026 DTP PACKAGING SOLUTIONS. Coded with Precision in
                        Quang Ngai.
                    </p>
                </div>
            </div>
        </footer>
    );
};
export default Footer;
