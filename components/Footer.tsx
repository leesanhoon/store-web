"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Footer() {
    const pathname = usePathname();

    if (isMobileMockupRoute(pathname)) {
        return null;
    }

    return (
        <footer
            id="footer"
            className="mt-16 border-t border-[#eadfce] bg-slate-950 text-white"
        >
            <div className="page-shell py-10">
                <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                            In ly sờ to
                        </p>
                        <p className="max-w-xl text-sm leading-7 text-white/72">
                            Giao diện mobile-first cho danh mục ly, nắp ly và
                            yêu cầu báo giá in logo.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                            Điều hướng
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm text-white/72">
                            <li>
                                <Link href="/">Trang chủ</Link>
                            </li>
                            <li>
                                <Link href="/products">Danh mục sản phẩm</Link>
                            </li>
                            <li>
                                <Link href="/admin">Admin</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
