"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { OrderSummaryDto } from "@/lib/api/orders";
import {
  AdminCard,
  AdminChip,
  AdminPrimaryButton,
  AdminStatusBadge,
  adminFormatMoney,
} from "@/components/admin/admin-ui";

type QuoteFilter = "Tất cả" | "Mới" | "Đã liên hệ" | "Đã báo giá" | "Đã từ chối";
type OrderFilter = "Tất cả" | "Đang sản xuất" | "Chờ xác nhận" | "Đã giao" | "Đã hủy";

type QuoteViewModel = {
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
  status: Exclude<QuoteFilter, "Tất cả">;
  orderStatus: Exclude<OrderFilter, "Tất cả">;
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

const filters: QuoteFilter[] = ["Tất cả", "Mới", "Đã liên hệ", "Đã báo giá", "Đã từ chối"];
const orderFilters: OrderFilter[] = ["Tất cả", "Đang sản xuất", "Chờ xác nhận", "Đã giao", "Đã hủy"];

const fallbackOrders: OrderSummaryDto[] = [
  {
    id: 250520001,
    customerName: "The Daily Café",
    totalAmount: 1430000,
    status: "Mới",
    createdAtUtc: "2025-05-20T09:15:00.000Z",
  },
  {
    id: 250520002,
    customerName: "Green Coffee",
    totalAmount: 980000,
    status: "Đã liên hệ",
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

const demoProfiles = [
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

const progressSteps = ["Đã gửi", "Báo giá", "Xác nhận", "Sản xuất", "Giao hàng"];

function formatSequence(id: number) {
  return String(id).slice(-3).padStart(3, "0");
}

function formatQuoteCode(id: number) {
  return `RQ250520-${formatSequence(id)}`;
}

function formatOrderCode(id: number) {
  return `DH250520-${formatSequence(id)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "20/05/2025 09:15";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function normalizeStatus(status: string, index: number): QuoteViewModel["status"] {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes("liên hệ") || lowerStatus.includes("contact")) return "Đã liên hệ";
  if (lowerStatus.includes("báo giá") || lowerStatus.includes("quoted")) return "Đã báo giá";
  if (lowerStatus.includes("từ chối") || lowerStatus.includes("reject")) return "Đã từ chối";
  if (lowerStatus.includes("mới") || lowerStatus.includes("new")) return "Mới";

  const fallbackStatuses: QuoteViewModel["status"][] = ["Mới", "Đã liên hệ", "Đã báo giá", "Đã từ chối"];
  return fallbackStatuses[index % fallbackStatuses.length];
}

function statusTone(status: QuoteViewModel["status"]) {
  if (status === "Đã liên hệ") return "success" as const;
  if (status === "Đã báo giá") return "info" as const;
  if (status === "Đã từ chối") return "neutral" as const;
  return "warning" as const;
}

function orderStatusTone(status: OrderFilter) {
  if (status === "Đang sản xuất" || status === "Đã giao") return "success" as const;
  if (status === "Chờ xác nhận") return "warning" as const;
  if (status === "Đã hủy") return "danger" as const;
  return "neutral" as const;
}

function normalizeOrderStatus(status: string, index: number): Exclude<OrderFilter, "Tất cả"> {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes("giao") || lowerStatus.includes("delivered")) return "Đã giao";
  if (lowerStatus.includes("hủy") || lowerStatus.includes("cancel")) return "Đã hủy";
  if (lowerStatus.includes("xác nhận") || lowerStatus.includes("pending")) return "Chờ xác nhận";
  if (lowerStatus.includes("sản xuất") || lowerStatus.includes("production")) return "Đang sản xuất";

  const fallbackStatuses: Exclude<OrderFilter, "Tất cả">[] = ["Đang sản xuất", "Chờ xác nhận", "Đã giao", "Đã hủy"];
  return fallbackStatuses[index % fallbackStatuses.length];
}

function buildQuoteViewModel(order: OrderSummaryDto, index: number): QuoteViewModel {
  const profile = demoProfiles[index % demoProfiles.length];
  const designFee = profile.printMethod === "Không in" ? 0 : 50000;
  const shippingFee = 30000;
  const totalAmount = order.totalAmount > 0 ? order.totalAmount : 1350000;
  const subtotal = Math.max(totalAmount - designFee - shippingFee, 0);

  return {
    id: order.id,
    quoteCode: formatQuoteCode(order.id),
    orderCode: formatOrderCode(order.id),
    customerName: order.customerName || "Kaffa House",
    customerPhone: "0901 234 567",
    customerEmail: "contact@kaffahouse.vn",
    customerAddress: "123 Nguyễn Thị Minh Khai, Q.3, TP. HCM",
    productName: profile.productName,
    productImage: profile.productImage,
    quantity: profile.quantity,
    quantityLabel: `${new Intl.NumberFormat("vi-VN").format(profile.quantity)} sp`,
    createdLabel: formatDateTime(order.createdAtUtc),
    status: normalizeStatus(order.status, index),
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
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M19 12H5m6 7-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2a2 2 0 0 1 2 1.72c.12.91.33 1.8.62 2.65a2 2 0 0 1-.45 2.11L7.4 8.36a16 16 0 0 0 6.24 6.24l.88-.88a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.65.62A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16m0 0v5h5M3 12a9 9 0 0 1 15-6.7L21 8m0 0V3h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuoteListScreen({
  quotes,
  activeFilter,
  expandedQuoteId,
  onChangeFilter,
  onToggleExpand,
}: {
  quotes: QuoteViewModel[];
  activeFilter: QuoteFilter;
  expandedQuoteId: number | null;
  onChangeFilter: (filter: QuoteFilter) => void;
  onToggleExpand: (id: number) => void;
}) {
  const visibleQuotes = quotes.filter((quote) => activeFilter === "Tất cả" || quote.status === activeFilter);

  return (
    <div className="space-y-3 text-[#0b1b3b]">
      <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">Yêu cầu báo giá</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((filter) => (
          <AdminChip key={filter} active={activeFilter === filter} onClick={() => onChangeFilter(filter)}>
            {filter}
          </AdminChip>
        ))}
      </div>

      <section className="space-y-2.5">
        {visibleQuotes.map((quote) => {
          const expanded = expandedQuoteId === quote.id;

          return (
            <AdminCard key={quote.id} className="overflow-hidden p-0">
              <div className="grid grid-cols-[1fr_auto] items-start gap-2 p-3">
                <div className="grid min-w-0 grid-cols-[1fr_54px_92px] items-center gap-2 text-left">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold text-[#0b1b3b]">{quote.quoteCode}</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-slate-600">{quote.customerName}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500">{quote.productName}</p>
                  </div>
                  <Image
                    src={quote.productImage}
                    alt={quote.productName}
                    width={72}
                    height={72}
                    className="h-[52px] w-[52px] rounded-xl object-cover"
                  />
                  <div className="min-w-0 text-[11px] font-semibold leading-5 text-slate-600">
                    <p>{quote.quantityLabel}</p>
                    <p className="truncate">{quote.createdLabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AdminStatusBadge tone={statusTone(quote.status)}>{quote.status}</AdminStatusBadge>
                  <button
                    type="button"
                    aria-label={expanded ? "Thu gọn yêu cầu" : "Mở chi tiết yêu cầu"}
                    onClick={() => onToggleExpand(quote.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#0b1b3b] transition hover:bg-[#f8f0e6]"
                  >
                    <ChevronIcon expanded={expanded} />
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="mx-3 mb-3 rounded-2xl border border-[#f1e7d8] bg-[#fffaf2] p-3">
                  <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2 text-[11px] font-semibold">
                    <dt className="text-slate-500">Yêu cầu in</dt>
                    <dd className="text-[#0b1b3b]">{quote.printMethod}</dd>
                    <dt className="text-slate-500">Màu in</dt>
                    <dd className="text-[#0b1b3b]">{quote.printColor}</dd>
                    <dt className="text-slate-500">Vị trí in</dt>
                    <dd className="text-[#0b1b3b]">{quote.printPosition}</dd>
                    <dt className="text-slate-500">Ghi chú</dt>
                    <dd className="text-[#0b1b3b]">{quote.note}</dd>
                    <dt className="text-slate-500">File logo</dt>
                    <dd className="flex min-w-0 items-center gap-2 text-[#0b1b3b]">
                      <Image
                        src="/images/mockups/logo-cup-500-urban.png"
                        alt="Logo preview"
                        width={40}
                        height={40}
                        className="h-9 w-9 rounded-lg border border-[#eadfce] object-cover"
                      />
                      <span className="truncate">{quote.logoFile}</span>
                    </dd>
                  </dl>
                </div>
              ) : null}
            </AdminCard>
          );
        })}

        {visibleQuotes.length === 0 ? (
          <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">
            Không có yêu cầu trong trạng thái này.
          </AdminCard>
        ) : null}
      </section>

      <div className="sticky bottom-2 z-10 pt-1">
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
  activeFilter,
  onChangeFilter,
  onOpenDetail,
}: {
  orders: QuoteViewModel[];
  activeFilter: OrderFilter;
  onChangeFilter: (filter: OrderFilter) => void;
  onOpenDetail: (id: number) => void;
}) {
  const visibleOrders = orders.filter((order) => activeFilter === "Tất cả" || order.orderStatus === activeFilter);

  return (
    <div className="space-y-3 text-[#0b1b3b]">
      <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">Đơn hàng</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {orderFilters.map((filter) => (
          <AdminChip key={filter} active={activeFilter === filter} onClick={() => onChangeFilter(filter)}>
            {filter}
          </AdminChip>
        ))}
      </div>

      <section className="space-y-2.5">
        {visibleOrders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onOpenDetail(order.id)}
            className="w-full rounded-[18px] border border-[#eadfce] bg-white p-3 text-left shadow-[0_18px_30px_-28px_rgba(15,23,42,0.3)] transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold text-[#0b1b3b]">{order.orderCode}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">Ngày đặt: {order.createdLabel}</p>
              </div>
              <AdminStatusBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminStatusBadge>
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
                <p className="truncate text-[13px] font-extrabold text-[#0b1b3b]">{order.customerName}</p>
                <p className="mt-1 truncate text-[12px] font-semibold text-slate-600">{order.productName}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">SL: {order.quantityLabel}</p>
              </div>
              <div className="text-right text-[12px] font-extrabold text-emerald-700">
                <p>{adminFormatMoney(order.totalAmount)}</p>
                <span className="mt-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#f8f0e6] text-[#0b1b3b]">
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </button>
        ))}

        {visibleOrders.length === 0 ? (
          <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">
            Không có đơn hàng trong trạng thái này.
          </AdminCard>
        ) : null}
      </section>
    </div>
  );
}

function DetailInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-bold text-[#0b1b3b]">{value}</dd>
    </>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-[#f1e7d8] pt-2 text-[13px] font-extrabold text-emerald-700" : ""}`}>
      <span>{label}</span>
      <b>{adminFormatMoney(value)}</b>
    </div>
  );
}

function OrderDetailScreen({ order, onBack }: { order: QuoteViewModel; onBack: () => void }) {
  const activeStep = 4;

  return (
    <div className="space-y-2.5 text-[#0b1b3b]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại danh sách đơn hàng"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#0b1b3b] transition hover:bg-[#f8f0e6]"
        >
          <ArrowLeftIcon />
        </button>
        <h1 className="text-[18px] font-extrabold leading-tight">Chi tiết đơn hàng</h1>
      </div>

      <AdminCard className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[18px] font-extrabold">{order.orderCode}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Ngày đặt: {order.createdLabel}</p>
          </div>
          <AdminStatusBadge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</AdminStatusBadge>
        </div>
        <p className="mt-1 text-right text-[11px] font-extrabold text-slate-600">SL: {order.quantityLabel}</p>

        <div className="relative mt-4 grid grid-cols-5 gap-1">
          <div className="absolute left-[10%] right-[10%] top-3 h-0.5 bg-[#dfe7dd]" />
          <div className="absolute left-[10%] top-3 h-0.5 w-[60%] bg-emerald-600" />
          {progressSteps.map((step, index) => {
            const complete = index + 1 <= activeStep;

            return (
              <div key={step} className="relative text-center">
                <span className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold ${complete ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-300"}`}>
                  {index + 1}
                </span>
                <p className={`mt-1 text-[9px] font-bold ${complete ? "text-[#0b1b3b]" : "text-slate-500"}`}>{step}</p>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard className="p-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-extrabold">Thông tin khách hàng</h2>
          <button type="button" aria-label="Gọi khách hàng" className="grid h-8 w-8 place-items-center rounded-full border border-[#eadfce] text-[#0b1b3b]">
            <PhoneIcon />
          </button>
        </div>
        <dl className="mt-2 grid grid-cols-[92px_1fr] gap-y-1.5 text-[11px] font-semibold">
          <DetailInfoRow label="Khách hàng" value={order.customerName} />
          <DetailInfoRow label="Liên hệ" value={order.customerPhone} />
          <DetailInfoRow label="Email" value={order.customerEmail} />
          <DetailInfoRow label="Địa chỉ" value={order.customerAddress} />
        </dl>
      </AdminCard>

      <AdminCard className="p-3.5">
        <h2 className="text-[13px] font-extrabold">Sản phẩm & yêu cầu in</h2>
        <div className="mt-2 grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border border-[#f1e7d8] bg-white p-2.5">
          <Image
            src={order.productImage}
            alt={order.productName}
            width={80}
            height={80}
            className="h-[58px] w-[58px] rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold">{order.productName}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-600">{order.printMethod} ({order.printColor})</p>
            <p className="mt-2 text-[11px] font-bold text-[#0b1b3b]">SL: {order.quantityLabel}</p>
          </div>
          <div className="text-right text-[11px] font-semibold text-slate-600">
            <ChevronIcon />
            <p className="mt-3">Vị trí: {order.printPosition}</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard className="space-y-1.5 p-3.5 text-[12px] font-semibold text-slate-600">
        <PriceRow label="Tạm tính" value={order.subtotal} />
        <PriceRow label="Phí thiết kế" value={order.designFee} />
        <PriceRow label="Phí vận chuyển (nội thành)" value={order.shippingFee} />
        <PriceRow label="Tổng thanh toán" value={order.totalAmount} strong />
      </AdminCard>

      <AdminCard className="p-3.5">
        <h2 className="text-[13px] font-extrabold">Checklist sản xuất</h2>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white">
              <CheckIcon />
            </span>
            Duyệt file thiết kế
          </span>
          <b className="text-emerald-700">Hoàn thành</b>
        </div>
      </AdminCard>

      <div className="sticky bottom-2 z-10 pt-1">
        <AdminPrimaryButton type="button" className="w-full">
          <RefreshIcon />
          Cập nhật tiến độ
        </AdminPrimaryButton>
      </div>
    </div>
  );
}

export default function AdminOrderClient({ initialOrders }: { initialOrders: OrderSummaryDto[] }) {
  const searchParams = useSearchParams();
  const isQuotePage = searchParams.get("view") === "quotes";
  const [activeFilter, setActiveFilter] = useState<QuoteFilter>("Tất cả");
  const [activeOrderFilter, setActiveOrderFilter] = useState<OrderFilter>("Tất cả");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(250520002);

  const quotes = useMemo(() => {
    const orders = initialOrders.length > 0 ? initialOrders : fallbackOrders;
    return orders.map(buildQuoteViewModel);
  }, [initialOrders]);

  const selectedQuote = quotes.find((quote) => quote.id === selectedOrderId) ?? quotes[0];

  if (isQuotePage) {
    return (
      <QuoteListScreen
        quotes={quotes}
        activeFilter={activeFilter}
        expandedQuoteId={expandedQuoteId}
        onChangeFilter={setActiveFilter}
        onToggleExpand={(id) => setExpandedQuoteId((currentId) => (currentId === id ? null : id))}
      />
    );
  }

  if (selectedOrderId && selectedQuote) {
    return <OrderDetailScreen order={selectedQuote} onBack={() => setSelectedOrderId(null)} />;
  }

  return (
    <OrderListScreen
      orders={quotes}
      activeFilter={activeOrderFilter}
      onChangeFilter={setActiveOrderFilter}
      onOpenDetail={setSelectedOrderId}
    />
  );
}
