import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { getLids } from "@/lib/api/lids";
import { getPartners } from "@/lib/api/partners";
import { getOrders, ORDER_STATUS_LABELS, type OrderSummaryDto, type OrderStatus } from "@/lib/api/orders";
import {
    AdminCard,
    AdminSectionHeader,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

const STATUS_DOT: Record<string, string> = {
    draft: "bg-slate-400",
    confirmed: "bg-amber-500",
    shipping: "bg-sky-500",
};

const STATUS_ACCENT: Record<string, string> = {
    draft: "border-slate-200",
    confirmed: "border-amber-200",
    shipping: "border-sky-200",
};

function PendingOrdersSection({
    title,
    orders,
    total,
    status,
    emptyText,
}: {
    title: string;
    orders: OrderSummaryDto[];
    total: number;
    status: OrderStatus;
    emptyText: string;
}) {
    const dot = STATUS_DOT[status] ?? "bg-slate-400";
    const accent = STATUS_ACCENT[status] ?? "border-slate-200";

    return (
        <AdminCard className={`p-3.5 border-l-[3px] ${accent}`}>
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#101a36]">
                    <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
                    {title}
                </h2>
                {total > 0 && (
                    <span className="rounded-full bg-[#101a36] px-2 py-0.5 text-[10px] font-extrabold text-white">
                        {total}
                    </span>
                )}
            </div>
            {orders.length === 0 ? (
                <p className="mt-2.5 rounded-[14px] border border-[#f1e7d8] bg-white px-3 py-4 text-center text-[12px] font-semibold text-slate-500">
                    {emptyText}
                </p>
            ) : (
                <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white">
                    {orders.map((order) => (
                        <Link
                            key={order.id}
                            href="/admin/order"
                            className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 border-b border-[#f1e7d8] px-3 py-2.5 last:border-b-0 transition-colors duration-200 active:bg-slate-50"
                        >
                            <p className="min-w-0 truncate text-[13px] font-extrabold text-[#101a36]">
                                #{order.id} — {order.customerName}
                            </p>
                            <p className="whitespace-nowrap text-right text-[12px] font-bold text-emerald-600">
                                {adminFormatMoney(order.totalAmount)}
                            </p>
                            <p className="text-[11px] font-semibold text-[#3d4860]">
                                {new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })}
                            </p>
                            <p className="text-right text-[11px] font-semibold text-slate-400">
                                {ORDER_STATUS_LABELS[order.status]}
                            </p>
                        </Link>
                    ))}
                    {total > orders.length && (
                        <Link
                            href="/admin/order"
                            className="block border-t border-[#f1e7d8] px-3 py-2.5 text-center text-[12px] font-bold text-[#0f766e] transition-colors active:bg-slate-50"
                        >
                            Xem tất cả {total} đơn →
                        </Link>
                    )}
                </div>
            )}
        </AdminCard>
    );
}

export default async function AdminPage() {
    const [products, lids, partnersResponse, allOrdersResponse] = await Promise.all([
        getProducts().catch(() => []),
        getLids().catch(() => []),
        getPartners({ pageSize: 100 }).catch(() => ({ items: [] })),
        getOrders(1, 100).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 100 })),
    ]);
    const partnerCount = partnersResponse.items.length;
    const allItems = allOrdersResponse.items;

    // Backend doesn't filter by status — filter client-side
    const draftItems = allItems.filter((o) => o.status === "draft");
    const confirmedItems = allItems.filter((o) => o.status === "confirmed");
    const shippingItems = allItems.filter((o) => o.status === "shipping");

    const productsWithVariants = products.filter((p) => p.variants.length > 0);

    const stats = [
        {
            label: "Tổng sản phẩm",
            value: products.length.toString(),
            delta: products.length ? "Dữ liệu API" : "Chưa có dữ liệu",
            suffix: "SP",
        },
        {
            label: "Có biến thể",
            value: productsWithVariants.length.toString(),
            delta: productsWithVariants.length ? "Đã cấu hình giá" : "Chưa có",
            suffix: "SP",
        },
        {
            label: "Tổng nắp",
            value: lids.length.toString(),
            delta: lids.length ? "Dữ liệu API" : "Chưa có dữ liệu",
            suffix: "loại",
        },
        {
            label: "Đối tác",
            value: String(partnerCount),
            delta: partnerCount > 0 ? "Đang hoạt động" : "Chưa có",
            suffix: "đối tác",
        },
        {
            label: "Tổng đơn hàng",
            value: String(allOrdersResponse.totalCount),
            delta: allOrdersResponse.totalCount > 0 ? "Tất cả trạng thái" : "Chưa có",
            suffix: "đơn",
        },
        {
            label: "Chờ xác nhận",
            value: String(draftItems.length),
            delta: draftItems.length > 0 ? "Cần xử lý" : "Không có",
            suffix: "đơn",
        },
    ];

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                title="Dashboard tổng quan"
                // action={
                //   <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-[#eadfce] bg-white px-3 text-[13px] font-bold text-[#1f2f46] shadow-sm">
                //     <CalendarIcon />
                //     Hôm nay
                //     <span aria-hidden="true" className="text-xl leading-none">›</span>
                //   </button>
                // }
            />

            <section className="grid grid-cols-2 gap-2.5">
                {stats.map((item) => (
                    <AdminCard key={item.label} className="min-h-[88px] p-3.5">
                        <p className="text-[13px] font-bold leading-tight text-[#1f2f46]">
                            {item.label}
                        </p>
                        <div className="mt-3 flex items-end justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[28px] font-extrabold leading-none tracking-tight text-[#101a36]">
                                    {item.value}
                                </p>
                                <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-emerald-600">
                                    {item.delta}
                                </p>
                            </div>
                            {item.suffix ? (
                                <span className="pb-1 text-[12px] font-bold text-[#1f2f46]">
                                    {item.suffix}
                                </span>
                            ) : null}
                        </div>
                    </AdminCard>
                ))}
            </section>

            <section className="grid grid-cols-2 gap-2.5">
                {[
                    {
                        href: "/admin/product?mode=create",
                        label: "Thêm sản phẩm",
                    },
                    { href: "/admin/lid?mode=create", label: "Thêm nắp" },
                    {
                        href: "/admin/partner?mode=create",
                        label: "Thêm đối tác",
                    },
                    { href: "/admin/order", label: "Quản lý đơn hàng" },
                    { href: "/admin/category", label: "Quản lý danh mục" },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-[16px] border border-[#eadfce] bg-white p-3 flex items-center justify-center text-[11px] font-extrabold text-[#101a36] shadow-sm"
                    >
                        {item.label}
                    </Link>
                ))}
            </section>

            <PendingOrdersSection
                title="Chờ xác nhận"
                orders={draftItems}
                total={draftItems.length}
                status="draft"
                emptyText="Không có đơn chờ xác nhận"
            />
            <PendingOrdersSection
                title="Đã xác nhận"
                orders={confirmedItems}
                total={confirmedItems.length}
                status="confirmed"
                emptyText="Không có đơn đã xác nhận"
            />
            <PendingOrdersSection
                title="Đang giao hàng"
                orders={shippingItems}
                total={shippingItems.length}
                status="shipping"
                emptyText="Không có đơn đang giao"
            />
        </div>
    );
}
