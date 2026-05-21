import React from "react";
import DtpLogo from "./DtpLogo";

const Footer = () => {
    return (
        <footer className="bg-brand-forest text-brand-light pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="mb-6 invert brightness-0">
                            <DtpLogo className="w-12 h-12" />
                        </div>
                        <p className="text-brand-sage/60 leading-relaxed">
                            DTP - Giải pháp bao bì chuyên nghiệp nâng tầm thương
                            hiệu đồ uống Việt với sứ mệnh đổi mới và bền vững.
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
                                    className="hover:text-brand-sage transition-colors"
                                >
                                    Trang chủ
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/products"
                                    className="hover:text-brand-sage transition-colors"
                                >
                                    Sản phẩm
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/about"
                                    className="hover:text-brand-sage transition-colors"
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
                                    className="hover:text-brand-sage transition-colors"
                                >
                                    Chính sách chất lượng
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-sage transition-colors"
                                >
                                    Quy trình đặt in
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-brand-sage transition-colors"
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
                            <p className="flex items-center gap-2">
                                <span className="text-brand-emerald">✉</span>{" "}
                                contact@dtp-packaging.vn
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-brand-emerald">✆</span>{" "}
                                0900 DTP PACK
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                                <span className="text-brand-emerald">📍</span>{" "}
                                Quận Tân Bình, TP. Hồ Chí Minh
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-brand-emerald/20 pt-8 text-center text-brand-sage/40 text-xs tracking-widest uppercase">
                    <p>© 2026 DTP PACKAGING SOLUTIONS. Coded with Precision.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
