import Link from "next/link";

const modules = [
    {
        title: "Product",
        description: "Quan ly san pham: them, sua, xoa, cap nhat gia.",
        href: "/admin/product",
        count: "128 san pham",
    },
    {
        title: "Category",
        description: "Quan ly danh muc san pham va trang thai hien thi.",
        href: "/admin/category",
        count: "12 category",
    },
    {
        title: "Order",
        description: "Theo doi don hang, xu ly trang thai va thanh toan.",
        href: "/admin/order",
        count: "36 don moi",
    },
];

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-900 to-emerald-900 p-7 text-white">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Admin Center</p>
                <h1 className="mt-2 text-3xl font-black">Tong Quan Quan Tri</h1>
                <p className="mt-2 text-sm text-cyan-50">
                    Chon mot muc ben duoi de vao man hinh quan ly chi tiet.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {modules.map((module) => (
                    <Link
                        key={module.title}
                        href={module.href}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {module.count}
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900 group-hover:text-cyan-700">
                            {module.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                    </Link>
                ))}
            </section>
        </div>
    );
}
