"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getOrder, OrderDetailDto, OrderSummaryDto } from "@/lib/api/orders";
import {
    AdminCard,
    AdminChip,
    AdminField,
    AdminPrimaryButton,
    AdminStatusBadge,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

type QuoteStatus =
    | "Mới"
    | "Đã liên hệ"
    | "Đã báo giá"
    | "Đã từ chối"
    | "Đã chuyển đơn";
type OrderStatus =
    | "Chờ xác nhận"
    | "Đã xác nhận"
    | "Đang thiết kế"
    | "Đang sản xuất"
    | "Đang giao"
    | "Đã giao"
    | "Đã hủy";
type QuoteFilter = "Tất cả" | QuoteStatus;
type OrderFilter = "Tất cả" | OrderStatus;

type AdminOrderViewModel = {
    id: number;
    quoteCode: string;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    productName: string;
    productImage: string;
    quantity: number;
    quantityLabel: string;
    createdLabel: string;
    quoteStatus: QuoteStatus;
    orderStatus: OrderStatus;
    printMethod: string;
    printColor: string;
    printPosition: string;
    note: string;
    logoFile: string;
    subtotal: number;
    designFee: number;
    shippingFee: number;
    totalAmount: number;
};

const quoteFilters: QuoteFilter[] = [
    "Tất cả",
    "Mới",
    "Đã liên hệ",
    "Đã báo giá",
    "Đã từ chối",
    "Đã chuyển đơn",
];
const orderFilters: OrderFilter[] = [
    "Tất cả",
    "Chờ xác nhận",
    "Đã xác nhận",
    "Đang thiết kế",
    "Đang sản xuất",
    "Đang giao",
    "Đã giao",
    "Đã hủy",
];
const orderFlow: OrderStatus[] = [
    "Chờ xác nhận",
    "Đã xác nhận",
    "Đang thiết kế",
    "Đang sản xuất",
    "Đang giao",
    "Đã giao",
];
const checklistItems = [
    "Duyệt file thiết kế",
    "Xác nhận mẫu in",
    "Chuẩn bị vật tư",
    "In ấn",
    "Đóng gói",
    "Giao hàng",
];

const fallbackOrders: OrderSummaryDto[] = [
    {
        id: 250520001,
        customerName: "The Daily Café",
        totalAmount: 1430000,
        status: "Đang sản xuất",
        createdAtUtc: "2025-05-20T09:15:00.000Z",
    },
    {
        id: 250520002,
        customerName: "Green Coffee",
        totalAmount: 980000,
        status: "Chờ xác nhận",
        createdAtUtc: "2025-05-20T10:30:00.000Z",
    },
    {
        id: 250520003,
        customerName: "Kaffa House",
        totalAmount: 1350000,
        status: "Đã báo giá",
        createdAtUtc: "2025-05-19T14:20:00.000Z",
    },
    {
        id: 250520004,
        customerName: "Nếp Của PET",
        totalAmount: 520000,
        status: "Đã từ chối",
        createdAtUtc: "2025-05-19T16:45:00.000Z",
    },
];

const productProfiles = [
    {
        productName: "Ly PET 16oz",
        productImage: "/images/mockups/pet-500-amber.png",
        quantity: 500,
        printMethod: "In 1 màu",
        printColor: "Đen",
        printPosition: "Thân ly",
        note: "Giao trước 05/06",
        logoFile: "dailycafe_logo.png",
    },
    {
        productName: "Ly giấy 12oz",
        productImage: "/images/mockups/paper-360-linen.png",
        quantity: 1000,
        printMethod: "In 1 màu",
        printColor: "Đen",
        printPosition: "Thân ly",
        note: "Giao trước 05/06",
        logoFile: "greencoffee_logo.png",
    },
    {
        productName: "Ly PET 20oz",
        productImage: "/images/mockups/pet-700-velvet.png",
        quantity: 800,
        printMethod: "In 2 màu",
        printColor: "Đen, Xanh lá",
        printPosition: "Thân ly",
        note: "Ưu tiên mẫu logo mới",
        logoFile: "kaffa_logo.png",
    },
    {
        productName: "Nắp cầu PET",
        productImage: "/images/ly/coc-nhua-dung-tau-hu-7.png",
        quantity: 1500,
        printMethod: "Không in",
        printColor: "-",
        printPosition: "-",
        note: "Theo size ly 16oz",
        logoFile: "no_logo.png",
    },
];

function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatSequence(id: number) {
    return String(id).slice(-3).padStart(3, "0");
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "20/05/2025 09:15";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function normalizeQuoteStatus(status: string, index: number): QuoteStatus {
    const lower = normalizeSearch(status);
    if (lower.includes("chuyen")) return "Đã chuyển đơn";
    if (lower.includes("lien he") || lower.includes("contact"))
        return "Đã liên hệ";
    if (lower.includes("bao gia") || lower.includes("quoted"))
        return "Đã báo giá";
    if (lower.includes("tu choi") || lower.includes("reject"))
        return "Đã từ chối";
    if (lower.includes("moi") || lower.includes("new")) return "Mới";
    return (["Mới", "Đã liên hệ", "Đã báo giá", "Đã từ chối"] as QuoteStatus[])[
        index % 4
    ];
}

function normalizeOrderStatus(status: string, index: number): OrderStatus {
    const lower = normalizeSearch(status);
    if (lower.includes("giao") || lower.includes("delivered"))
        return lower.includes("dang") ? "Đang giao" : "Đã giao";
    if (lower.includes("huy") || lower.includes("cancel")) return "Đã hủy";
    if (lower.includes("thiet ke")) return "Đang thiết kế";
    if (lower.includes("xac nhan"))
        return lower.includes("cho") ? "Chờ xác nhận" : "Đã xác nhận";
    if (lower.includes("san xuat") || lower.includes("production"))
        return "Đang sản xuất";
    return (
        ["Đang sản xuất", "Chờ xác nhận", "Đã giao", "Đã hủy"] as OrderStatus[]
    )[index % 4];
}

function badgeTone(status: QuoteStatus | OrderStatus) {
    if (
        [
            "Đã liên hệ",
            "Đã chuyển đơn",
            "Đã xác nhận",
            "Đang sản xuất",
            "Đang giao",
            "Đã giao",
        ].includes(status)
    )
        return "success" as const;
    if (["Mới", "Chờ xác nhận", "Đang thiết kế"].includes(status))
        return "warning" as const;
    if (["Đã báo giá"].includes(status)) return "info" as const;
    if (["Đã từ chối", "Đã hủy"].includes(status)) return "danger" as const;
    return "neutral" as const;
}

function buildViewModel(
    order: OrderSummaryDto,
    index: number,
): AdminOrderViewModel {
    const profile = productProfiles[index % productProfiles.length];
    const designFee = profile.printMethod === "Không in" ? 0 : 50000;
    const shippingFee = 30000;
    const totalAmount = order.totalAmount > 0 ? order.totalAmount : 1350000;
    const subtotal = Math.max(totalAmount - designFee - shippingFee, 0);
    return {
        id: order.id,
        quoteCode: `RQ250520-${formatSequence(order.id)}`,
        orderCode: `DH250520-${formatSequence(order.id)}`,
        customerName: order.customerName || "Kaffa House",
        customerPhone: "0901 234 567",
        customerEmail: "contact@kaffahouse.vn",
        customerAddress: "123 Nguyễn Thị Minh Khai, Q.3, TP. HCM",
        productName: profile.productName,
        productImage: profile.productImage,
        quantity: profile.quantity,
        quantityLabel: `${new Intl.NumberFormat("vi-VN").format(profile.quantity)} sp`,
        createdLabel: formatDateTime(order.createdAtUtc),
        quoteStatus: normalizeQuoteStatus(order.status, index),
        orderStatus: normalizeOrderStatus(order.status, index),
        printMethod: profile.printMethod,
        printColor: profile.printColor,
        printPosition: profile.printPosition,
        note: profile.note,
        logoFile: profile.logoFile,
        subtotal,
        designFee,
        shippingFee,
        totalAmount,
    };
}

function ArrowLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M19 12H5m6 7-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="m22 2-7 20-4-9-9-4 20-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M22 2 11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="m5 12 4 4 10-10"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function nextOrderStatus(status: OrderStatus): OrderStatus {
    const index = orderFlow.indexOf(status);
    if (index < 0 || index === orderFlow.length - 1) return status;
    return orderFlow[index + 1];
}

function QuoteDetailScreen({
    quote,
    history,
    onBack,
    onChangeStatus,
}: {
    quote: AdminOrderViewModel;
    history: string[];
    onBack: () => void;
    onChangeStatus: (status: QuoteStatus, message: string) => void;
}) {
    return (
        <div className="space-y-3 text-[#101a36]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#101a36]"
                    aria-label="Quay lại báo giá"
                >
                    <ArrowLeftIcon />
                </button>
                <h1 className="text-[18px] font-extrabold">Chi tiết báo giá</h1>
            </div>
            <AdminCard className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[18px] font-extrabold">
                            {quote.quoteCode}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {quote.createdLabel}
                        </p>
                    </div>
                    <AdminStatusBadge tone={badgeTone(quote.quoteStatus)}>
                        {quote.quoteStatus}
                    </AdminStatusBadge>
                </div>
                <dl className="mt-3 grid grid-cols-[92px_1fr] gap-y-1.5 text-[11px] font-semibold">
                    <dt className="text-slate-500">Khách hàng</dt>
                    <dd className="font-bold">{quote.customerName}</dd>
                    <dt className="text-slate-500">Liên hệ</dt>
                    <dd className="font-bold">{quote.customerPhone}</dd>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-bold">{quote.customerEmail}</dd>
                    <dt className="text-slate-500">Sản phẩm</dt>
                    <dd className="font-bold">{quote.productName}</dd>
                    <dt className="text-slate-500">Số lượng</dt>
                    <dd className="font-bold">{quote.quantityLabel}</dd>
                </dl>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[14px] font-extrabold">
                    Yêu cầu in và logo
                </h2>
                <div className="mt-2 grid grid-cols-[64px_1fr] gap-3">
                    <Image
                        src={quote.productImage}
                        alt={quote.productName}
                        width={80}
                        height={80}
                        className="h-16 w-16 rounded-xl object-cover"
                    />
                    <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-[11px] font-semibold">
                        <dt className="text-slate-500">Yêu cầu</dt>
                        <dd>{quote.printMethod}</dd>
                        <dt className="text-slate-500">Màu in</dt>
                        <dd>{quote.printColor}</dd>
                        <dt className="text-slate-500">Vị trí</dt>
                        <dd>{quote.printPosition}</dd>
                        <dt className="text-slate-500">Ghi chú</dt>
                        <dd>{quote.note}</dd>
                        <dt className="text-slate-500">File</dt>
                        <dd className="truncate">{quote.logoFile}</dd>
                    </dl>
                </div>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[14px] font-extrabold">Lịch sử xử lý</h2>
                <div className="mt-2 space-y-2">
                    {history.map((item) => (
                        <p
                            key={item}
                            className="rounded-xl bg-[#fffaf2] px-3 py-2 text-[11px] font-semibold text-slate-600"
                        >
                            {item}
                        </p>
                    ))}
                </div>
            </AdminCard>
            <div className="grid grid-cols-2 gap-2">
                <AdminPrimaryButton
                    type="button"
                    onClick={() =>
                        onChangeStatus(
                            "Đã liên hệ",
                            "Đã đánh dấu đã liên hệ khách hàng.",
                        )
                    }
                    className="min-h-11 rounded-[14px] text-[13px]"
                >
                    Đã liên hệ
                </AdminPrimaryButton>
                <AdminPrimaryButton
                    type="button"
                    onClick={() =>
                        onChangeStatus(
                            "Đã báo giá",
                            "Đã gửi báo giá cho khách hàng.",
                        )
                    }
                    className="min-h-11 rounded-[14px] text-[13px]"
                >
                    Gửi báo giá
                </AdminPrimaryButton>
                <button
                    type="button"
                    onClick={() =>
                        onChangeStatus(
                            "Đã từ chối",
                            "Đã từ chối yêu cầu báo giá.",
                        )
                    }
                    className="min-h-11 rounded-[14px] border border-rose-200 bg-rose-50 text-[13px] font-extrabold text-rose-700"
                >
                    Từ chối
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onChangeStatus(
                            "Đã chuyển đơn",
                            "Đã chuyển báo giá thành đơn hàng.",
                        )
                    }
                    className="min-h-11 rounded-[14px] border border-emerald-200 bg-emerald-50 text-[13px] font-extrabold text-emerald-700"
                >
                    Chuyển đơn
                </button>
            </div>
        </div>
    );
}

function QuoteListScreen({
    quotes,
    statuses,
    activeFilter,
    selectedQuoteId,
    onChangeFilter,
    onOpenDetail,
}: {
    quotes: AdminOrderViewModel[];
    statuses: Record<number, QuoteStatus>;
    activeFilter: QuoteFilter;
    selectedQuoteId: number | null;
    onChangeFilter: (filter: QuoteFilter) => void;
    onOpenDetail: (id: number) => void;
}) {
    const visibleQuotes = quotes.filter(
        (quote) =>
            activeFilter === "Tất cả" ||
            (statuses[quote.id] ?? quote.quoteStatus) === activeFilter,
    );
    return (
        <div className="admin-with-fixed-cta space-y-3 text-[#101a36]">
            <h1 className="text-[22px] font-extrabold">Yêu cầu báo giá</h1>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quoteFilters.map((filter) => (
                    <AdminChip
                        key={filter}
                        active={activeFilter === filter}
                        onClick={() => onChangeFilter(filter)}
                    >
                        {filter}
                    </AdminChip>
                ))}
            </div>
            <section className="space-y-2.5">
                {visibleQuotes.map((quote) => {
                    const status = statuses[quote.id] ?? quote.quoteStatus;
                    return (
                        <button
                            key={quote.id}
                            type="button"
                            onClick={() => onOpenDetail(quote.id)}
                            className={`w-full rounded-[18px] border bg-white p-3 text-left shadow-[0_18px_30px_-28px_rgba(15,23,42,0.3)] ${selectedQuoteId === quote.id ? "border-[#101a36]" : "border-[#eadfce]"}`}
                        >
                            <div className="grid grid-cols-[1fr_54px_auto] items-center gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-extrabold">
                                        {quote.quoteCode}
                                    </p>
                                    <p className="mt-1 truncate text-[11px] font-bold text-slate-600">
                                        {quote.customerName}
                                    </p>
                                    <p className="truncate text-[11px] font-semibold text-slate-500">
                                        {quote.productName}
                                    </p>
                                </div>
                                <Image
                                    src={quote.productImage}
                                    alt={quote.productName}
                                    width={72}
                                    height={72}
                                    className="h-[52px] w-[52px] rounded-xl object-cover"
                                />
                                <div className="grid justify-items-end gap-1">
                                    <AdminStatusBadge tone={badgeTone(status)}>
                                        {status}
                                    </AdminStatusBadge>
                                    <ChevronIcon />
                                </div>
                            </div>
                            <div className="mt-2 grid grid-cols-[1fr_auto] text-[11px] font-semibold text-slate-600">
                                <span>{quote.quantityLabel}</span>
                                <span>{quote.createdLabel}</span>
                            </div>
                        </button>
                    );
                })}
                {visibleQuotes.length === 0 ? (
                    <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">
                        Không có yêu cầu trong trạng thái này.
                    </AdminCard>
                ) : null}
            </section>
            <div className="admin-fixed-cta">
                <AdminPrimaryButton type="button" className="w-full">
                    <SendIcon />
                    Gửi báo giá
                </AdminPrimaryButton>
            </div>
        </div>
    );
}

function OrderListScreen({
    orders,
    statuses,
    searchTerm,
    activeFilter,
    onSearch,
    onChangeFilter,
    onOpenDetail,
}: {
    orders: AdminOrderViewModel[];
    statuses: Record<number, OrderStatus>;
    searchTerm: string;
    activeFilter: OrderFilter;
    onSearch: (value: string) => void;
    onChangeFilter: (filter: OrderFilter) => void;
    onOpenDetail: (id: number) => void;
}) {
    const visibleOrders = orders.filter((order) => {
        const status = statuses[order.id] ?? order.orderStatus;
        const haystack = normalizeSearch(
            `${order.orderCode} ${order.customerName} ${order.productName} ${status} ${order.createdLabel}`,
        );
        return (
            (activeFilter === "Tất cả" || status === activeFilter) &&
            (!searchTerm.trim() ||
                haystack.includes(normalizeSearch(searchTerm.trim())))
        );
    });
    return (
        <div className="space-y-3 text-[#101a36]">
            <div className="admin-sticky-filters">
                <h1 className="text-[22px] font-extrabold">Đơn hàng</h1>
                <AdminField
                    value={searchTerm}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder="Tìm mã đơn, khách hàng, sản phẩm..."
                />
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {orderFilters.map((filter) => (
                        <AdminChip
                            key={filter}
                            active={activeFilter === filter}
                            onClick={() => onChangeFilter(filter)}
                        >
                            {filter}
                        </AdminChip>
                    ))}
                </div>
            </div>
            <section className="space-y-2.5 pt-7">
                {visibleOrders.map((order) => {
                    const status = statuses[order.id] ?? order.orderStatus;
                    return (
                        <button
                            key={order.id}
                            type="button"
                            onClick={() => onOpenDetail(order.id)}
                            className="w-full rounded-[18px] border border-[#eadfce] bg-white p-3 text-left shadow-[0_18px_30px_-28px_rgba(15,23,42,0.3)]"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-[15px] font-extrabold">
                                        {order.orderCode}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                        Ngày đặt: {order.createdLabel}
                                    </p>
                                </div>
                                <AdminStatusBadge tone={badgeTone(status)}>
                                    {status}
                                </AdminStatusBadge>
                            </div>
                            <div className="mt-3 grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-2xl border border-[#f1e7d8] bg-[#fffdf9] p-2.5">
                                <Image
                                    src={order.productImage}
                                    alt={order.productName}
                                    width={72}
                                    height={72}
                                    className="h-[54px] w-[54px] rounded-xl object-cover"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-extrabold">
                                        {order.customerName}
                                    </p>
                                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-600">
                                        {order.productName}
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                                        SL: {order.quantityLabel}
                                    </p>
                                </div>
                                <div className="text-right text-[12px] font-extrabold text-emerald-700">
                                    <p>{adminFormatMoney(order.totalAmount)}</p>
                                    <span className="mt-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#f8f0e6] text-[#101a36]">
                                        <ChevronIcon />
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
                {visibleOrders.length === 0 ? (
                    <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">
                        Không có đơn hàng phù hợp.
                    </AdminCard>
                ) : null}
            </section>
        </div>
    );
}

function OrderDetailScreen({
    order,
    detail,
    loading,
    history,
    checklist,
    onBack,
    onAdvance,
    onToggleChecklist,
}: {
    order: AdminOrderViewModel;
    detail: OrderDetailDto | null;
    loading: boolean;
    history: string[];
    checklist: Record<string, boolean>;
    onBack: () => void;
    onAdvance: () => void;
    onToggleChecklist: (item: string) => void;
}) {
    const detailItems = detail?.items ?? [];
    const activeStep = Math.max(orderFlow.indexOf(order.orderStatus), 0);
    return (
        <div className="admin-with-fixed-cta space-y-2.5 text-[#101a36]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#101a36]"
                    aria-label="Quay lại danh sách đơn hàng"
                >
                    <ArrowLeftIcon />
                </button>
                <h1 className="text-[18px] font-extrabold">
                    Chi tiết đơn hàng
                </h1>
            </div>
            {loading ? (
                <AdminCard className="p-3 text-[12px] font-semibold text-slate-500">
                    Đang tải chi tiết đơn từ API...
                </AdminCard>
            ) : null}
            <AdminCard className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[18px] font-extrabold">
                            {order.orderCode}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            Ngày đặt: {order.createdLabel}
                        </p>
                    </div>
                    <AdminStatusBadge tone={badgeTone(order.orderStatus)}>
                        {order.orderStatus}
                    </AdminStatusBadge>
                </div>
                <p className="mt-1 text-right text-[11px] font-extrabold text-slate-600">
                    SL: {order.quantityLabel}
                </p>
                <div className="relative mt-4 grid grid-cols-6 gap-1">
                    <div className="absolute left-[8%] right-[8%] top-3 h-0.5 bg-[#dfe7dd]" />
                    <div
                        className="absolute left-[8%] top-3 h-0.5 bg-emerald-600"
                        style={{ width: `${Math.min(activeStep, 5) * 16}%` }}
                    />
                    {orderFlow.map((step, index) => {
                        const complete = index <= activeStep;
                        return (
                            <div key={step} className="relative text-center">
                                <span
                                    className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold ${complete ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-300"}`}
                                >
                                    {index + 1}
                                </span>
                                <p
                                    className={`mt-1 text-[8.5px] font-bold ${complete ? "text-[#101a36]" : "text-slate-500"}`}
                                >
                                    {step.replace("Đang ", "")}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[13px] font-extrabold">
                    Thông tin khách hàng
                </h2>
                <dl className="mt-2 grid grid-cols-[92px_1fr] gap-y-1.5 text-[11px] font-semibold">
                    <dt className="text-slate-500">Khách hàng</dt>
                    <dd className="font-bold">
                        {detail?.customerName ?? order.customerName}
                    </dd>
                    <dt className="text-slate-500">Liên hệ</dt>
                    <dd className="font-bold">
                        {detail?.customerPhone ?? order.customerPhone}
                    </dd>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-bold">
                        {detail?.customerEmail ?? order.customerEmail}
                    </dd>
                    <dt className="text-slate-500">Địa chỉ</dt>
                    <dd className="font-bold">{order.customerAddress}</dd>
                </dl>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[13px] font-extrabold">
                    Sản phẩm & yêu cầu in
                </h2>
                <div className="mt-2 grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border border-[#f1e7d8] bg-white p-2.5">
                    <Image
                        src={order.productImage}
                        alt={order.productName}
                        width={80}
                        height={80}
                        className="h-[58px] w-[58px] rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold">
                            {detailItems[0]?.productName ?? order.productName}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-600">
                            {order.printMethod} ({order.printColor})
                        </p>
                        <p className="mt-2 text-[11px] font-bold">
                            SL:{" "}
                            {detailItems[0]?.quantity
                                ? `${new Intl.NumberFormat("vi-VN").format(detailItems[0].quantity)} sp`
                                : order.quantityLabel}
                        </p>
                    </div>
                    <p className="text-right text-[11px] font-semibold text-slate-600">
                        Vị trí:
                        <br />
                        {order.printPosition}
                    </p>
                </div>
            </AdminCard>
            <AdminCard className="space-y-1.5 p-3.5 text-[12px] font-semibold text-slate-600">
                <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <b>{adminFormatMoney(order.subtotal)}</b>
                </div>
                <div className="flex justify-between">
                    <span>Phí thiết kế</span>
                    <b>{adminFormatMoney(order.designFee)}</b>
                </div>
                <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <b>{adminFormatMoney(order.shippingFee)}</b>
                </div>
                <div className="flex justify-between border-t border-[#f1e7d8] pt-2 text-[13px] font-extrabold text-emerald-700">
                    <span>Tổng thanh toán</span>
                    <b>
                        {adminFormatMoney(
                            detail?.totalAmount ?? order.totalAmount,
                        )}
                    </b>
                </div>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[13px] font-extrabold">
                    Checklist sản xuất
                </h2>
                <div className="mt-2 space-y-2">
                    {checklistItems.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onToggleChecklist(item)}
                            className="flex w-full items-center justify-between rounded-xl bg-[#fffaf2] px-3 py-2 text-left text-[11px] font-semibold"
                        >
                            <span className="inline-flex items-center gap-2">
                                <span
                                    className={`grid h-5 w-5 place-items-center rounded-full ${checklist[item] ? "bg-emerald-600 text-white" : "bg-white text-slate-400 ring-1 ring-slate-300"}`}
                                >
                                    {checklist[item] ? <CheckIcon /> : null}
                                </span>
                                {item}
                            </span>
                            <b
                                className={
                                    checklist[item]
                                        ? "text-emerald-700"
                                        : "text-slate-400"
                                }
                            >
                                {checklist[item] ? "Hoàn thành" : "Chờ"}
                            </b>
                        </button>
                    ))}
                </div>
            </AdminCard>
            <AdminCard className="p-3.5">
                <h2 className="text-[13px] font-extrabold">
                    Lịch sử hoạt động
                </h2>
                <div className="mt-2 space-y-2">
                    {history.map((item) => (
                        <p
                            key={item}
                            className="rounded-xl bg-[#fffaf2] px-3 py-2 text-[11px] font-semibold text-slate-600"
                        >
                            {item}
                        </p>
                    ))}
                </div>
            </AdminCard>
            <div className="admin-fixed-cta">
                <AdminPrimaryButton
                    type="button"
                    onClick={onAdvance}
                    className="w-full"
                >
                    Cập nhật tiến độ
                </AdminPrimaryButton>
            </div>
        </div>
    );
}

export default function AdminOrderClient({
    initialOrders,
}: {
    initialOrders: OrderSummaryDto[];
}) {
    const searchParams = useSearchParams();
    const isQuotePage = searchParams.get("view") === "quotes";
    const [activeQuoteFilter, setActiveQuoteFilter] =
        useState<QuoteFilter>("Tất cả");
    const [activeOrderFilter, setActiveOrderFilter] =
        useState<OrderFilter>("Tất cả");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [quoteStatuses, setQuoteStatuses] = useState<
        Record<number, QuoteStatus>
    >({});
    const [orderStatuses, setOrderStatuses] = useState<
        Record<number, OrderStatus>
    >({});
    const [checklist, setChecklist] = useState<
        Record<number, Record<string, boolean>>
    >({});
    const [history, setHistory] = useState<Record<number, string[]>>({});
    const [detail, setDetail] = useState<OrderDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const rows = useMemo(() => {
        const orders =
            initialOrders.length > 0 ? initialOrders : fallbackOrders;
        return orders.map(buildViewModel).map((row) => ({
            ...row,
            quoteStatus: quoteStatuses[row.id] ?? row.quoteStatus,
            orderStatus: orderStatuses[row.id] ?? row.orderStatus,
        }));
    }, [initialOrders, orderStatuses, quoteStatuses]);
    const selectedOrder =
        rows.find((row) => row.id === selectedOrderId) ?? null;
    const selectedQuote =
        rows.find((row) => row.id === selectedQuoteId) ?? null;

    const appendHistory = (id: number, item: string) => {
        setHistory((current) => ({
            ...current,
            [id]: [
                `${new Date().toLocaleString("vi-VN")}: ${item}`,
                ...(current[id] ?? [
                    `${rows.find((row) => row.id === id)?.createdLabel}: Tạo yêu cầu.`,
                ]),
            ],
        }));
    };

    const openOrderDetail = (id: number) => {
        setDetail(null);
        setSelectedOrderId(id);
        if (id < 0) return;
        setDetailLoading(true);
        void getOrder(id)
            .then(setDetail)
            .catch(() => setDetail(null))
            .finally(() => setDetailLoading(false));
    };

    if (isQuotePage) {
        if (selectedQuote) {
            return (
                <QuoteDetailScreen
                    quote={selectedQuote}
                    history={
                        history[selectedQuote.id] ?? [
                            `${selectedQuote.createdLabel}: Tạo yêu cầu báo giá.`,
                        ]
                    }
                    onBack={() => setSelectedQuoteId(null)}
                    onChangeStatus={(status, message) => {
                        setQuoteStatuses((current) => ({
                            ...current,
                            [selectedQuote.id]: status,
                        }));
                        appendHistory(selectedQuote.id, message);
                    }}
                />
            );
        }
        return (
            <QuoteListScreen
                quotes={rows}
                statuses={quoteStatuses}
                activeFilter={activeQuoteFilter}
                selectedQuoteId={selectedQuoteId}
                onChangeFilter={setActiveQuoteFilter}
                onOpenDetail={setSelectedQuoteId}
            />
        );
    }

    if (selectedOrder) {
        const currentChecklist = checklist[selectedOrder.id] ?? {
            [checklistItems[0]]: true,
        };
        return (
            <OrderDetailScreen
                order={selectedOrder}
                detail={detail}
                loading={detailLoading}
                history={
                    history[selectedOrder.id] ?? [
                        `${selectedOrder.createdLabel}: Đơn hàng được tạo.`,
                    ]
                }
                checklist={currentChecklist}
                onBack={() => {
                    setDetail(null);
                    setSelectedOrderId(null);
                }}
                onAdvance={() => {
                    const next = nextOrderStatus(selectedOrder.orderStatus);
                    setOrderStatuses((current) => ({
                        ...current,
                        [selectedOrder.id]: next,
                    }));
                    appendHistory(
                        selectedOrder.id,
                        `Cập nhật trạng thái thành ${next}.`,
                    );
                }}
                onToggleChecklist={(item) => {
                    setChecklist((current) => ({
                        ...current,
                        [selectedOrder.id]: {
                            ...currentChecklist,
                            [item]: !currentChecklist[item],
                        },
                    }));
                }}
            />
        );
    }

    return (
        <OrderListScreen
            orders={rows}
            statuses={orderStatuses}
            searchTerm={searchTerm}
            activeFilter={activeOrderFilter}
            onSearch={setSearchTerm}
            onChangeFilter={setActiveOrderFilter}
            onOpenDetail={openOrderDetail}
        />
    );
}
