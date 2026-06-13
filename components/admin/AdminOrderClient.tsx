"use client";

import { useCallback, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { InlineSpinner } from "@/components/ui/LoadingOverlay";
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

function ChevronRightMini() {
    return (
        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
            <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function XMini() {
    return (
        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function ChevronLeftIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="m12 5-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function OrderRow({
    order,
    index,
    onStatusChange,
}: {
    order: OrderSummaryDto;
    index: number;
    onStatusChange: (id: number, status: OrderStatus) => Promise<void>;
}) {
    const transitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    const [updating, setUpdating] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const handleTransition = async (newStatus: OrderStatus) => {
        if (newStatus === "cancelled") {
            setCancelConfirm(true);
            return;
        }
        setUpdating(true);
        try {
            await onStatusChange(order.id, newStatus);
        } finally {
            setUpdating(false);
        }
    };

    const confirmCancel = async () => {
        setUpdating(true);
        try {
            await onStatusChange(order.id, "cancelled");
        } finally {
            setUpdating(false);
            setCancelConfirm(false);
        }
    };

    return (
        <div
            className="admin-card-enter"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <AdminCard className="p-2">
                <div className="rounded-[calc(20px-8px)] border border-[#f1e7d8] bg-[#fffdf8] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[10px] bg-[#101a36]/[0.05] px-1.5 text-[10px] font-extrabold text-[#101a36]">
                                #{order.id}
                            </span>
                            <AdminStatusBadge tone={statusTone(order.status)}>
                                {ORDER_STATUS_LABELS[order.status]}
                            </AdminStatusBadge>
                        </div>
                        <p className="shrink-0 text-[15px] font-extrabold tracking-tight text-[#101a36]">
                            {adminFormatMoney(order.totalAmount)}
                        </p>
                    </div>

                    <div className="mt-2.5">
                        <p className="text-[14px] font-extrabold text-[#101a36] truncate">
                            {order.customerName}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                            {formatDate(order.createdAtUtc)}
                        </p>
                    </div>
                </div>

                {transitions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 px-1.5 pb-0.5">
                        {transitions.map((next) => (
                            <button
                                key={next}
                                type="button"
                                disabled={updating}
                                onClick={() => handleTransition(next)}
                                className={`group inline-flex items-center gap-1.5 rounded-full py-2 pl-3.5 pr-2 text-[11px] font-extrabold transition-all duration-300 ease-[var(--ease-spring)] active:scale-[0.95] disabled:opacity-50 ${
                                    next === "cancelled"
                                        ? "border border-rose-200 bg-rose-50 text-rose-600"
                                        : "border border-[#eadfce] bg-white text-[#101a36] shadow-sm hover:shadow-md"
                                }`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    {updating && <InlineSpinner className="h-3.5 w-3.5" />}
                                    {ORDER_STATUS_LABELS[next]}
                                </span>
                                <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 ease-[var(--ease-spring)] group-hover:translate-x-0.5 ${
                                        next === "cancelled"
                                            ? "bg-rose-100"
                                            : "bg-[#101a36]/[0.05]"
                                    }`}
                                >
                                    {next === "cancelled" ? <XMini /> : <ChevronRightMini />}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </AdminCard>

            <ConfirmModal
                open={cancelConfirm}
                title={`Hủy đơn hàng #${order.id}?`}
                description="Đơn hàng sẽ chuyển sang trạng thái đã hủy và không thể hoàn tác."
                icon="⚠️"
                danger
                confirmLabel="Hủy đơn"
                cancelLabel="Quay lại"
                loading={updating}
                onConfirm={confirmCancel}
                onCancel={() => setCancelConfirm(false)}
            />
        </div>
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

    const { data: statusCounts } = useSWR("admin-order-counts", async () => {
        const [all, confirmed, shipping] = await Promise.all([
            getOrders(1, 1),
            getOrders(1, 1, "confirmed"),
            getOrders(1, 1, "shipping"),
        ]);
        return {
            all: all.totalCount,
            confirmed: confirmed.totalCount,
            shipping: shipping.totalCount,
        };
    });

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
        <div className="space-y-4 text-[#101a36]">
            <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0f766e]">
                    Quản lý
                </p>
                <AdminSectionHeader
                    title="Đơn hàng"
                    subtitle={data ? `${data.totalCount} đơn hàng` : undefined}
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <AdminCard className="p-3 text-center">
                    <p className="text-[22px] font-extrabold tracking-tight text-[#101a36]">
                        {statusCounts?.all ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Tất cả
                    </p>
                </AdminCard>
                <AdminCard className="p-3 text-center">
                    <p className="text-[22px] font-extrabold tracking-tight text-orange-500">
                        {statusCounts?.confirmed ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Chờ xử lý
                    </p>
                </AdminCard>
                <AdminCard className="p-3 text-center">
                    <p className="text-[22px] font-extrabold tracking-tight text-blue-500">
                        {statusCounts?.shipping ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Đang giao
                    </p>
                </AdminCard>
            </div>

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
                        {data.items.map((order, i) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                index={i}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-3">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#101a36] shadow-sm transition-all duration-300 ease-[var(--ease-spring)] active:scale-[0.93] disabled:opacity-30"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <span className="min-w-[60px] text-center text-[12px] font-extrabold text-[#101a36]">
                                {page} <span className="text-slate-400">/ {totalPages}</span>
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#101a36] shadow-sm transition-all duration-300 ease-[var(--ease-spring)] active:scale-[0.93] disabled:opacity-30"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
