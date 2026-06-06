import Link from "next/link";
import { ReactNode } from "react";

const adminNav = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/product", label: "Sản phẩm" },
  { href: "/admin/category", label: "Danh mục" },
  { href: "/admin/order", label: "Đơn hàng" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/print-types", label: "Print types" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="surface-gradient min-h-[100dvh] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="panel-strong p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Admin center
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-header sm:text-3xl">
                Quản trị Store-web
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Không gian quản lý cho sản phẩm, danh mục, vật liệu, kiểu in và đơn hàng.
              </p>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Điều hướng admin">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
