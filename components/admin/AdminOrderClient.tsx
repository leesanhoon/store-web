"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrder, type OrderDetailDto, type OrderSummaryDto } from "@/lib/api/orders";
import OrderTimeline from "@/components/OrderTimeline";

export default function AdminOrderClient({ initialOrders }: { initialOrders: OrderSummaryDto[] }) {
    const [orders] = useState<OrderSummaryDto[]>(initialOrders);
    const [selectedId, setSelectedId] = useState<number | null>(initialOrders[0]?.id ?? null);
    const [detail, setDetail] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedSummary = useMemo(() => orders.find((order) => order.id === selectedId) ?? null, [orders, selectedId]);

    useEffect(() => {
        void (async () => {
            if (!selectedId) {
                setDetail(null);
                return;
            }
            setLoading(true);
            setError("");
            try {
                setDetail(await getOrder(selectedId));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Không thể tải chi tiết đơn.");
                setDetail(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedId]);

    return (
        <div className="space-y-6">
            <section className="panel-strong bg-[#111] p-7 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">Order Center</p>
                <h1 className="mt-2 text-3xl font-semibold">Quản lý đơn hàng</h1>
                <p className="mt-2 text-sm text-white/70">Dữ liệu lấy trực tiếp từ API Orders.</p>
            </section>

            <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
                <aside className="rounded-3xl border border-[#e6e0d8] bg-white p-5">
                    <h2 className="text-lg font-semibold text-header">Danh sách đơn</h2>
                    <div className="mt-4 space-y-3">
                        {orders.length === 0 ? (
                            <p className="text-sm font-medium text-slate-600">Chưa có đơn nào.</p>
                        ) : (
                            orders.map((order) => (
                                <button
                                    key={order.id}
                                    type="button"
                                    onClick={() => setSelectedId(order.id)}
                                    className={`w-full rounded-2xl border p-4 text-left ${order.id === selectedId ? "border-slate-900 bg-slate-50" : "border-[#e6e0d8] bg-white"}`}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">#{order.id}</p>
                                    <p className="mt-1 font-semibold text-header">{order.customerName}</p>
                                    <p className="mt-1 text-sm text-slate-600">{order.status}</p>
                                    <p className="mt-1 text-sm text-slate-600">{order.totalAmount.toLocaleString("vi-VN")}d</p>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="mt-4">
                        <Link href="/track-order" className="button-secondary w-full">Tra cứu đơn</Link>
                    </div>
                </aside>

                <div className="space-y-6">
                    {loading ? <div className="panel p-6 text-sm text-slate-500">Đang tải chi tiết...</div> : null}
                    {error ? <div className="panel border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">{error}</div> : null}
                    {detail ? (
                        <article className="panel p-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">#{detail.id}</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-header">{detail.customerName}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{detail.customerPhone || "Chưa có số"}</p>
                                    <p className="mt-1 text-sm text-slate-500">{new Date(detail.createdAtUtc).toLocaleString("vi-VN")}</p>
                                </div>
                                <span className="rounded-full border border-[#dbcfc0] bg-[#fcfaf7] px-4 py-2 text-sm font-semibold text-slate-800">
                                    {detail.status}
                                </span>
                            </div>

                            <div className="mt-6">
                                <OrderTimeline status={detail.status as never} />
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                {detail.items.map((item) => (
                                    <div key={`${item.productId}-${item.unitPrice}`} className="rounded-2xl bg-[#fcfaf7] p-4">
                                        <h3 className="font-semibold text-header">{item.productName}</h3>
                                        <p className="mt-1 text-sm text-slate-600">SL: {item.quantity} | {item.unitPrice.toLocaleString("vi-VN")}d</p>
                                        <p className="mt-1 text-sm text-slate-500">Material: {item.materialName || "-"} | Print: {item.printTypeName || "-"}</p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ) : (
                        <div className="panel p-6 text-sm font-medium text-slate-600">{selectedSummary ? "Không tải được chi tiết." : "Chưa có đơn được chọn."}</div>
                    )}
                </div>
            </section>
        </div>
    );
}

