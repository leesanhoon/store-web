"use client";

import { useMemo, useState } from "react";
import { OrderRecord, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, updateOrderMeta, updateOrderStatus } from "@/lib/orders";
import OrderTimeline from "@/components/OrderTimeline";

type Props = {
    initialOrders: OrderRecord[];
};

export default function AdminOrderClient({ initialOrders }: Props) {
    const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
    const [selectedId, setSelectedId] = useState(initialOrders[0]?.id ?? "");
    const [internalNote, setInternalNote] = useState("");
    const [mockupFileName, setMockupFileName] = useState("");
    const [message, setMessage] = useState("");

    const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedId) ?? null, [orders, selectedId]);

    const refreshSelected = (nextOrders: OrderRecord[]) => {
        setOrders(nextOrders);
        const nextSelected = nextOrders.find((order) => order.id === selectedId) ?? nextOrders[0] ?? null;
        if (nextSelected) {
            setSelectedId(nextSelected.id);
            setInternalNote(nextSelected.internalNote);
            setMockupFileName(nextSelected.mockupFileName);
        } else {
            setSelectedId("");
            setInternalNote("");
            setMockupFileName("");
        }
    };

    const handleSelect = (order: OrderRecord) => {
        setSelectedId(order.id);
        setInternalNote(order.internalNote);
        setMockupFileName(order.mockupFileName);
        setMessage("");
    };

    const handleStatus = (status: OrderRecord["status"]) => {
        if (!selectedOrder) return;
        const nextOrders = updateOrderStatus(selectedOrder.id, status);
        refreshSelected(nextOrders);
        setMessage(`Đã cập nhật trạng thái thành ${ORDER_STATUS_LABEL[status]}.`);
    };

    const handleSaveMeta = () => {
        if (!selectedOrder) return;
        const nextOrders = updateOrderMeta(selectedOrder.id, {
            internalNote,
            mockupFileName,
        });
        refreshSelected(nextOrders);
        setMessage("Đã lưu ghi chú nội bộ và file mockup.");
    };

    return (
        <div className="space-y-6">
            <section className="panel-strong bg-[#111111] p-7 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">Order Center</p>
                <h1 className="mt-2 text-3xl font-semibold">Quản lý đơn hàng in</h1>
                <p className="mt-2 text-sm text-white/70">
                    Đơn đang được lấy từ localStorage để mô phỏng quy trình giai đoạn 4.
                </p>
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
                                    onClick={() => handleSelect(order)}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${
                                        order.id === selectedId
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-[#e6e0d8] bg-white hover:bg-[#fbfaf7]"
                                    }`}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{order.id}</p>
                                    <p className="mt-1 font-semibold text-header">{order.businessName || order.fullName}</p>
                                    <p className="mt-1 text-sm text-slate-600">{ORDER_STATUS_LABEL[order.status]}</p>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <div className="space-y-6">
                    {selectedOrder ? (
                        <article className="panel p-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{selectedOrder.id}</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-header">
                                        {selectedOrder.businessName || selectedOrder.fullName}
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                        {selectedOrder.fullName} | {selectedOrder.phone}
                                    </p>
                                </div>
                                <span className="rounded-full border border-[#ddd6cb] bg-[#fbfaf7] px-4 py-2 text-sm font-semibold text-slate-800">
                                    {ORDER_STATUS_LABEL[selectedOrder.status]}
                                </span>
                            </div>

                            <div className="mt-6">
                                <OrderTimeline status={selectedOrder.status} />
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                {selectedOrder.items.map((item) => (
                                    <div key={`${item.productId}-${item.unit}`} className="rounded-2xl bg-[#fbfaf7] p-4">
                                        <h3 className="font-semibold text-header">{item.name}</h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            SL: {item.quantity} | {item.price.toLocaleString("vi-VN")}đ
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-800">
                                    Ghi chú nội bộ
                                    <textarea
                                        rows={4}
                                        value={internalNote}
                                        onChange={(event) => setInternalNote(event.target.value)}
                                        className="input-modern"
                                        placeholder="Ghi chú sales/designer"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-800">
                                    File mockup
                                    <input
                                        value={mockupFileName}
                                        onChange={(event) => setMockupFileName(event.target.value)}
                                        className="input-modern"
                                        placeholder="ten-file-mockup.pdf"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {ORDER_STATUS_FLOW.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleStatus(status)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                            status === selectedOrder.status
                                                ? "bg-slate-900 text-white"
                                                : "border border-[#ddd6cb] bg-white text-slate-700 hover:bg-[#fbfaf7]"
                                        }`}
                                    >
                                        {ORDER_STATUS_LABEL[status]}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button type="button" onClick={handleSaveMeta} className="button-primary px-5 py-3">
                                    Lưu ghi chú / mockup
                                </button>
                            </div>

                            {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
                        </article>
                    ) : (
                        <div className="panel p-6 text-sm font-medium text-slate-600">Chưa có đơn được chọn.</div>
                    )}

                    <div className="panel bg-[#fbfaf7] p-6">
                        <h2 className="text-xl font-semibold text-header">Luồng giai đoạn 4</h2>
                        <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-700">
                            <li>Mã đơn và số điện thoại dùng để tra cứu công khai.</li>
                            <li>Timeline trạng thái phản ánh tiến độ thiết kế và sản xuất.</li>
                            <li>Admin lưu được ghi chú nội bộ và tên file mockup.</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
