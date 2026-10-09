import { connection } from "next/server";
import Link from "next/link";
import { getProducts, isLidProduct } from "@/lib/api/products";
import { getOrders, ORDER_STATUS_LABELS, type OrderSummaryDto, type OrderStatus } from "@/lib/api/orders";
import {
    AdminCard,
    AdminSectionHeader,
    AdminStatusBadge,
    ORDER_STATUS_TONE,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

const QUEUE_PREVIEW = 5;

const QUICK_ACTIONS = [
    { href: "/admin/product?mode=create", label: "Thêm sản phẩm" },
    { href: "/admin/lid?mode=create", label: "Thêm nắp" },
    { href: "/admin/partner?mode=create", label: "Thêm đối tác" },
    { href: "/admin/order", label: "Quản lý đơn hàng" },
    { href: "/admin/category", label: "Quản lý danh mục" },
];

function ChevronRightIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
            <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function OrderQueue({
    status,
    orders,
    emptyText,
    className = "",
}: {
    status: OrderStatus;
    orders: OrderSummaryDto[];
    emptyText: string;
    className?: string;
}) {
    const href = `/admin/order?status=${status}`;
    const preview = orders.slice(0, QUEUE_PREVIEW);

    return (
        <AdminCard className={className}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <h2 className="text-lg font-semibold text-ink">{ORDER_STATUS_LABELS[status]}</h2>
                <AdminStatusBadge tone={ORDER_STATUS_TONE[status]}>{orders.length} đơn</AdminStatusBadge>
            </div>
            {preview.length === 0 ? (
                <p className="border-t border-line px-4 py-6 text-center text-sm text-body">{emptyText}</p>
            ) : (
                <ul className="divide-y divide-line border-t border-line">
                    {preview.map((order) => (
                        <li key={order.id}>
                            <Link
                                href={href}
                                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-4 py-3 transition-colors hover:bg-surface"
                            >
                                <span className="truncate text-sm font-medium text-ink">
                                    #{order.id} · {order.customerName}
                                </span>
                                <span className="whitespace-nowrap text-right text-sm font-semibold text-ink">
                                    {adminFormatMoney(order.totalAmount)}
                                </span>
                                <time dateTime={order.createdAtUtc} className="col-span-2 text-xs text-muted">
                                    {new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </time>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            {orders.length > preview.length && (
                <Link
                    href={href}
                    className="flex min-h-11 items-center justify-center border-t border-line px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface"
                >
                    Xem tất cả {orders.length} đơn
                </Link>
            )}
        </AdminCard>
    );
}

export default async function AdminPage() {
    await connection();
    const [products, allOrdersResponse] = await Promise.all([
        getProducts().catch(() => []),
        getOrders(1, 100).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 100 })),
    ]);
    const lidCount = products.filter(isLidProduct).length;
    const cupCount = products.length - lidCount;
    const allItems = allOrdersResponse.items;

    // Backend doesn't filter by status — filter client-side
    const pendingItems = allItems.filter((o) => o.status === "PendingConfirmation");
    const confirmedItems = allItems.filter((o) => o.status === "Confirmed");
    const shippingItems = allItems.filter((o) => o.status === "Shipping");

    const kpis = [
        { label: "Chờ xác nhận", value: pendingItems.length, href: "/admin/order?status=PendingConfirmation" },
        { label: "Đang giao", value: shippingItems.length, href: "/admin/order?status=Shipping" },
        { label: "Tổng đơn", value: allOrdersResponse.totalCount, href: "/admin/order" },
        { label: "Ly / Nắp", value: `${cupCount} / ${lidCount}`, href: "/admin/product" },
    ];

    return (
        <div className="space-y-6">
            <AdminSectionHeader title="Tổng quan" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <Link
                        key={kpi.label}
                        href={kpi.href}
                        className="flex min-h-24 flex-col justify-between gap-3 rounded-lg border border-line bg-white p-4 shadow-sm transition-colors hover:border-primary"
                    >
                        <span className="flex items-center justify-between gap-2 text-sm font-medium text-label">
                            {kpi.label}
                            <ChevronRightIcon />
                        </span>
                        <span className="text-3xl font-semibold leading-none text-ink">{kpi.value}</span>
                    </Link>
                ))}
            </div>

            <div role="group" aria-label="Thao tác nhanh" className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="inline-flex min-h-11 items-center rounded-sm border border-line-strong bg-white px-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary md:min-h-10"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <OrderQueue
                    status="PendingConfirmation"
                    orders={pendingItems}
                    emptyText="Không có đơn chờ xác nhận"
                    className="lg:col-span-2"
                />
                <OrderQueue
                    status="Confirmed"
                    orders={confirmedItems}
                    emptyText="Không có đơn đã xác nhận"
                />
                <OrderQueue
                    status="Shipping"
                    orders={shippingItems}
                    emptyText="Không có đơn đang giao"
                />
            </div>
        </div>
    );
}
