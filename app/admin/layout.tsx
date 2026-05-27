import Link from "next/link";
import { ReactNode } from "react";

const tabs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Product", href: "/admin/product" },
    { label: "Category", href: "/admin/category" },
    { label: "Order", href: "/admin/order" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dcfce7_0%,_#ecfeff_45%,_#f8fafc_100%)] px-4 py-10 sm:px-8">
            <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 shadow-xl backdrop-blur">
                <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-7">{children}</div>
            </section>
        </div>
    );
}
