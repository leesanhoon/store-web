"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { InlineSpinner } from "@/components/ui/LoadingOverlay";
import {
    AdminChip,
    AdminEmptyState,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminStatusBadge,
    ORDER_STATUS_TONE,
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

type StatusFilter = OrderStatus | "all";

const ALL_STATUSES: StatusFilter[] = ["all", "PendingConfirmation", "Confirmed", "Shipping", "Completed", "Cancelled"];

const STATUS_LABEL: Record<StatusFilter, string> = {
    all: "Tất cả",
    ...ORDER_STATUS_LABELS,
};

// Transition buttons say what they do, not the status they lead to
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
    Confirmed: "Xác nhận đơn",
    Shipping: "Bắt đầu giao",
    Completed: "Hoàn tất",
    Cancelled: "Hủy đơn",
};

const COUNT_FILTERS = ["PendingConfirmation", "Shipping", "all"] as const;

const PAGE_SIZE = 20;

function parseStatus(value: string | null): StatusFilter {
    return ALL_STATUSES.find((status) => status === value) ?? "all";
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

function AlertIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6.5v4M10 13.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

// Mobile: flat card (id + status / name + total / date / actions).
// ≥768: one row of the parent's subgrid: #id | khách | ngày | tổng | trạng thái | hành động.
function OrderRow({
    order,
    onStatusChange,
}: {
    order: OrderSummaryDto;
    onStatusChange: (id: number, status: OrderStatus) => Promise<void>;
}) {
    const transitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    const [pendingAction, setPendingAction] = useState<OrderStatus | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runTransition = async (next: OrderStatus) => {
        setPendingAction(next);
        setError(null);
        try {
            await onStatusChange(order.id, next);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Cập nhật thất bại");
        } finally {
            setPendingAction(null);
            setCancelConfirm(false);
        }
    };

    return (
        <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-white p-4 shadow-sm md:col-span-full md:grid-cols-subgrid md:gap-y-2 md:rounded-none md:border-0 md:border-t md:py-3 md:shadow-none">
            <p className="text-sm font-semibold text-ink">#{order.id}</p>
            <p className="truncate text-base font-semibold text-ink md:text-sm md:font-medium">
                {order.customerName}
            </p>
            <p className="text-sm text-body">
                <time dateTime={order.createdAtUtc}>{formatDate(order.createdAtUtc)}</time>
            </p>
            <p className="col-start-2 row-start-2 whitespace-nowrap text-right text-base font-semibold text-ink md:col-start-auto md:row-start-auto md:text-sm">
                {adminFormatMoney(order.totalAmount)}
            </p>
            <div className="col-start-2 row-start-1 justify-self-end whitespace-nowrap md:col-start-auto md:row-start-auto md:justify-self-start">
                <AdminStatusBadge tone={ORDER_STATUS_TONE[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                </AdminStatusBadge>
            </div>

            {transitions.length > 0 && (
                <div className="col-span-2 mt-2 flex flex-wrap gap-2 whitespace-nowrap md:col-span-1 md:mt-0 md:justify-end">
                    {transitions.map((next) => (
                        <AdminPrimaryButton
                            key={next}
                            type="button"
                            variant={next === "Cancelled" ? "danger" : "primary"}
                            disabled={pendingAction !== null}
                            onClick={() => (next === "Cancelled" ? setCancelConfirm(true) : runTransition(next))}
                        >
                            {pendingAction === next && <InlineSpinner className="h-4 w-4" />}
                            {ACTION_LABEL[next] ?? ORDER_STATUS_LABELS[next]}
                        </AdminPrimaryButton>
                    ))}
                </div>
            )}

            {error && (
                <p
                    role="alert"
                    className="col-span-full mt-2 flex gap-2 rounded-sm border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger md:mt-0"
                >
                    <AlertIcon />
                    <span>
                        Không thể cập nhật đơn #{order.id}: {error}
                    </span>
                </p>
            )}

            <ConfirmModal
                open={cancelConfirm}
                title={`Hủy đơn hàng #${order.id}?`}
                description="Đơn hàng sẽ chuyển sang trạng thái đã hủy và không thể hoàn tác."
                danger
                confirmLabel="Hủy đơn"
                cancelLabel="Quay lại"
                loading={pendingAction === "Cancelled"}
                onConfirm={() => runTransition("Cancelled")}
                onCancel={() => setCancelConfirm(false)}
            />
        </li>
    );
}

function OrderList({ initialFilter }: { initialFilter: StatusFilter }) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilter);
    const [page, setPage] = useState(1);

    const { data, error, isLoading, mutate } = useSWR(
        ["admin-orders", page, statusFilter],
        () => getOrders(page, PAGE_SIZE, statusFilter === "all" ? undefined : statusFilter),
    );

    const { data: statusCounts, mutate: mutateCounts } = useSWR("admin-order-counts", async () => {
        const [pending, shipping, all] = await Promise.all([
            getOrders(1, 1, "PendingConfirmation"),
            getOrders(1, 1, "Shipping"),
            getOrders(1, 1),
        ]);
        return {
            PendingConfirmation: pending.totalCount,
            Shipping: shipping.totalCount,
            all: all.totalCount,
        };
    });

    // Throws on failure: the row shows the error inline
    const handleStatusChange = useCallback(
        async (orderId: number, newStatus: OrderStatus) => {
            await updateOrderStatus(orderId, newStatus);
            mutate();
            mutateCounts();
        },
        [mutate, mutateCounts],
    );

    const selectFilter = (status: StatusFilter) => {
        setStatusFilter(status);
        setPage(1);
    };

    const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

    return (
        <div className="space-y-4">
            <AdminSectionHeader
                title="Đơn hàng"
                subtitle={data ? `${data.totalCount} đơn hàng` : undefined}
            />

            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {COUNT_FILTERS.map((status) => {
                    const active = statusFilter === status;
                    return (
                        <button
                            key={status}
                            type="button"
                            aria-pressed={active}
                            onClick={() => selectFilter(status)}
                            className={`flex min-h-11 flex-col items-start gap-2 rounded-lg border p-3 text-left shadow-sm transition-colors md:p-4 ${
                                active ? "border-primary bg-primary-soft" : "border-line bg-white hover:border-primary"
                            }`}
                        >
                            <span className="text-sm font-medium text-label">{STATUS_LABEL[status]}</span>
                            <span className="text-2xl font-semibold leading-none text-ink md:text-3xl">
                                {statusCounts?.[status] ?? "—"}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => (
                    <AdminChip
                        key={status}
                        active={statusFilter === status}
                        onClick={() => selectFilter(status)}
                    >
                        {STATUS_LABEL[status]}
                    </AdminChip>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-3" aria-busy="true">
                    <p role="status" className="sr-only">
                        Đang tải đơn hàng…
                    </p>
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="skeleton h-28 rounded-lg md:h-16" aria-hidden="true" />
                    ))}
                </div>
            ) : error ? (
                <div
                    role="alert"
                    className="flex flex-col items-start gap-3 rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger md:flex-row md:items-center md:justify-between"
                >
                    <p className="flex gap-2">
                        <AlertIcon />
                        Không thể tải danh sách đơn hàng. Vui lòng thử lại.
                    </p>
                    <AdminPrimaryButton type="button" variant="secondary" onClick={() => mutate()}>
                        Thử lại
                    </AdminPrimaryButton>
                </div>
            ) : !data || data.items.length === 0 ? (
                <AdminEmptyState>Không có đơn hàng nào</AdminEmptyState>
            ) : (
                <>
                    <ul className="grid gap-3 md:grid-cols-[auto_minmax(7rem,1fr)_auto_auto_auto_auto] md:gap-x-4 md:gap-y-0 md:rounded-lg md:border md:border-line md:bg-white md:shadow-sm">
                        <li
                            aria-hidden="true"
                            className="hidden text-sm font-medium text-label md:col-span-full md:grid md:grid-cols-subgrid md:px-4 md:py-3"
                        >
                            <span>Mã đơn</span>
                            <span>Khách hàng</span>
                            <span>Ngày đặt</span>
                            <span className="text-right">Tổng tiền</span>
                            <span>Trạng thái</span>
                            <span className="text-right">Thao tác</span>
                        </li>
                        {data.items.map((order) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </ul>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Phân trang"
                            className="flex items-center justify-between gap-3 md:justify-center"
                        >
                            <AdminPrimaryButton
                                type="button"
                                variant="secondary"
                                aria-label="Trang trước"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeftIcon />
                                Trước
                            </AdminPrimaryButton>
                            <p className="text-sm text-body">
                                Trang {page} / {totalPages}
                            </p>
                            <AdminPrimaryButton
                                type="button"
                                variant="secondary"
                                aria-label="Trang sau"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau
                                <ChevronRightIcon />
                            </AdminPrimaryButton>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}

export default function AdminOrderClient() {
    const status = useSearchParams().get("status");
    // Keyed on ?status= so a link to another status (dashboard, sidebar) resets the filter and page
    return <OrderList key={status ?? "all"} initialFilter={parseStatus(status)} />;
}
