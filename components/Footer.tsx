import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="mt-12 border-t border-[#e6e0d8] bg-[#111111] text-white">
            <div className="page-shell py-10 lg:py-14">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Image src="/images/logo.png" alt="DTP Logo" width={48} height={48} className="h-auto w-10 rounded-xl bg-white/10 p-1" />
                            <div>
                                <p className="font-display text-xl font-semibold">DTP Packaging</p>
                                <p className="text-sm text-white/65">Ly nhựa, ly giấy, in logo</p>
                            </div>
                        </div>
                        <p className="max-w-md text-sm leading-7 text-white/65">
                            Giải pháp bao bì F&B cho quán cà phê, trà sữa và chuỗi đồ uống, tối ưu từ lựa chọn mẫu đến đặt in.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Giải pháp</h4>
                        <ul className="mt-4 space-y-3 text-sm text-white/65">
                            <li>
                                <Link href="/products" className="transition hover:text-white">
                                    Ly nhựa PET, PP
                                </Link>
                            </li>
                            <li>
                                <Link href="/products" className="transition hover:text-white">
                                    Ly giấy
                                </Link>
                            </li>
                            <li>
                                <Link href="/gallery" className="transition hover:text-white">
                                    Gallery mẫu ly
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Đặt hàng</h4>
                        <ul className="mt-4 space-y-3 text-sm text-white/65">
                            <li>Chọn mẫu ly</li>
                            <li>Gửi số lượng và logo</li>
                            <li>Nhận báo giá và duyệt mẫu</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Liên hệ</h4>
                        <div className="mt-4 space-y-3 text-sm text-white/65">
                            <p>contact@dtp-packaging.vn</p>
                            <p className="font-semibold text-white">0900 DTP PACK</p>
                            <p>TP. Quảng Ngãi, Quảng Ngãi</p>
                        </div>
                    </div>
                </div>
                <div className="mt-10 border-t border-white/10 pt-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                    © 2026 DTP Packaging Solutions
                </div>
            </div>
        </footer>
    );
}
