"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import {
    AdminCard,
    AdminChip,
    AdminEmptyState,
    AdminSectionHeader,
    AdminStatusBadge,
    adminFormatMoney,
} from "@/components/admin/admin-ui";
import {
    getOrders,
    updateOrderStatus,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_TRANSITIONS,
    type OrderStatus,
    type OrderSummaryDto,
} from "@/lib/api/orders";

const ALL_STATUSES: (OrderStatus | "all")[] = ["all", "draft", "confirmed", "shipping", "completed", "cancelled"];

const STATUS_LABEL: Record<string, string> = {
    all: "Tất cả",
    ...ORDER_STATUS_LABELS,
};

function statusTone(status: OrderStatus): "neutral" | "success" | "warning" | "info" | "danger" {
    switch (status) {
        case "completed":
            return "success";
        case "confirmed":
            return "warning";
        case "shipping":
            return "info";
        case "cancelled":
            return "danger";
        default:
            return "neutral";
    }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function OrderRow({
    order,
    onStatusChange,
}: {
    order: OrderSummaryDto;
    onStatusChange: (id: number, status: OrderStatus) => Promise<void>;
}) {
    const transitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    const [updating, setUpdating] = useState(false);

    const handleTransition = async (newStatus: OrderStatus) => {
        setUpdating(true);
        try {
            await onStatusChange(order.id, newStatus);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <AdminCard className="p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-slate-400">#{order.id}</span>
                        <AdminStatusBadge tone={statusTone(order.status)}>
                            {ORDER_STATUS_LABELS[order.status]}
                        </AdminStatusBadge>
                    </div>
                    <p className="mt-1.5 text-[15px] font-extrabold text-[#101a36] truncate">
                        {order.customerName}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-400">
                        {formatDate(order.createdAtUtc)}
                    </p>
                </div>
                <p className="shrink-0 text-[15px] font-extrabold text-[#101a36]">
                    {adminFormatMoney(order.totalAmount)}
                </p>
            </div>

            {transitions.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {transitions.map((next) => (
                        <button
                            key={next}
                            type="button"
                            disabled={updating}
                            onClick={() => handleTransition(next)}
                            className={`rounded-xl px-3 py-1.5 text-[12px] font-bold transition active:scale-[0.97] disabled:opacity-50 ${
                                next === "cancelled"
                                    ? "border border-rose-200 bg-rose-50 text-rose-600"
                                    : "border border-[#eadfce] bg-white text-[#101a36] shadow-sm"
                            }`}
                        >
                            {updating ? "..." : `→ ${ORDER_STATUS_LABELS[next]}`}
                        </button>
                    ))}
                </div>
            ) : null}
        </AdminCard>
    );
}

export default function AdminOrderClient() {
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data, error, isLoading, mutate } = useSWR(
        ["admin-orders", page, statusFilter],
        () => getOrders(page, pageSize, statusFilter === "all" ? undefined : statusFilter),
    );

    const handleStatusChange = useCallback(
        async (orderId: number, newStatus: OrderStatus) => {
            try {
                await updateOrderStatus(orderId, newStatus);
                mutate();
            } catch (err) {
                alert(err instanceof Error ? err.message : "Cập nhật thất bại");
            }
        },
        [mutate],
    );

    const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                title="Đơn hàng"
                subtitle={data ? `${data.totalCount} đơn hàng` : undefined}
            />

            <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => (
                    <AdminChip
                        key={s}
                        active={statusFilter === s}
                        onClick={() => {
                            setStatusFilter(s);
                            setPage(1);
                        }}
                    >
                        {STATUS_LABEL[s]}
                    </AdminChip>
                ))}
            </div>

            {isLoading ? (
                <AdminCard className="p-6 text-center">
                    <p className="text-[13px] font-semibold text-slate-500">Đang tải...</p>
                </AdminCard>
            ) : error ? (
                <AdminCard className="p-6 text-center">
                    <p className="text-[13px] font-semibold text-rose-500">
                        Không thể tải danh sách đơn hàng. Vui lòng thử lại.
                    </p>
                </AdminCard>
            ) : !data || data.items.length === 0 ? (
                <AdminEmptyState>Không có đơn hàng nào</AdminEmptyState>
            ) : (
                <>
                    <div className="space-y-3">
                        {data.items.map((order) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>

                    {totalPages > 1 ? (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-[13px] font-bold text-[#101a36] shadow-sm disabled:opacity-40"
                            >
                                ← Trước
                            </button>
                            <span className="text-[13px] font-semibold text-slate-500">
                                {page} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-[13px] font-bold text-[#101a36] shadow-sm disabled:opacity-40"
                            >
                                Sau →
                            </button>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}
