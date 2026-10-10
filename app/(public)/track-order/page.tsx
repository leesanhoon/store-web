"use client";

import { use, useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  CloseIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from "@/components/mobile-store/icons";
import { trackOrder, ORDER_STATUS_LABELS, type OrderDetailDto, type OrderStatus, type OrderItemDto } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/products/display";
import { SITE } from "@/lib/site";

const CARD = "rounded-lg border border-line bg-white p-4 shadow-sm md:p-6";

/* ── Status tones: same mapping as ORDER_STATUS_TONE in admin-ui ── */
const STATUS_CONFIG: Record<OrderStatus, string> = {
  PendingConfirmation: "bg-warning-soft text-warning",
  Confirmed: "bg-blue-50 text-blue-700",
  Shipping: "bg-blue-50 text-blue-700",
  Completed: "bg-success-soft text-success",
  Cancelled: "bg-surface text-label",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-current/20 px-2 py-1 text-sm font-semibold ${STATUS_CONFIG[status]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ── Timeline ── */
const STATUS_STEPS: OrderStatus[] = ["PendingConfirmation", "Confirmed", "Shipping", "Completed"];

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-md border border-danger/20 bg-danger-soft p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-danger">
          <CloseIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-danger">Đơn hàng đã bị hủy</p>
          <p className="mt-0.5 text-sm text-body">Liên hệ cửa hàng để biết thêm chi tiết.</p>
        </div>
      </div>
    );
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <ol className="grid grid-cols-4" aria-label="Tiến trình đơn hàng">
      {STATUS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li
            key={step}
            className="relative flex flex-col items-center text-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {index < STATUS_STEPS.length - 1 && (
              <span
                className={`absolute top-[15px] left-[calc(50%+20px)] h-0.5 w-[calc(100%-40px)] ${
                  index < currentIndex ? "bg-primary" : "bg-line"
                }`}
                aria-hidden="true"
              />
            )}
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                done ? "bg-primary text-white" : "border border-line-strong bg-white text-muted"
              } ${isCurrent ? "ring-4 ring-primary-soft" : ""}`}
              aria-hidden="true"
            >
              {done ? <CheckIcon className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={`mt-2 text-[13px] leading-tight ${
                done ? "font-semibold text-ink" : "text-muted"
              }`}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Product line ── */
function OrderItemRow({ item }: { item: OrderItemDto }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-semibold text-ink">{item.productName}</p>
        {SITE.showPrices ? (
          <span className="shrink-0 font-semibold text-price">{formatCurrency(item.unitPrice * item.quantity)}</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-body">
        Số lượng: {item.quantity.toLocaleString("vi-VN")}
        {SITE.showPrices ? ` · Đơn giá: ${formatCurrency(item.unitPrice)}` : null}
        {item.lidName ? ` · Nắp: ${item.lidName}` : null}
      </p>
    </li>
  );
}

/* ── Info row helper ── */
function InfoRow({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="h-5 w-5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <p className="break-words text-ink">{value}</p>
      </div>
    </div>
  );
}

function HelpCard() {
  return (
    <section className={CARD}>
      <h3 className="text-lg">Cần hỗ trợ về đơn hàng?</h3>
      <p className="mt-1 text-sm text-body">Liên hệ cửa hàng qua Zalo hoặc gọi trực tiếp.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SITE.zaloHref ? (
          <a href={SITE.zaloHref} target="_blank" rel="noopener noreferrer" className="button-primary grow">
            <ChatIcon className="h-5 w-5" />
            Nhắn Zalo
          </a>
        ) : null}
        {SITE.phoneHref ? (
          <a href={SITE.phoneHref} className="button-secondary grow">
            <PhoneIcon className="h-5 w-5" />
            Gọi {SITE.phoneDisplay}
          </a>
        ) : null}
      </div>
    </section>
  );
}

type FieldErrors = { id?: string; phone?: string };

/* ── Main page ── */
export default function TrackOrderPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id: prefillId } = use(searchParams);
  const [orderId, setOrderId] = useState(typeof prefillId === "string" ? prefillId : "");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const orderIdRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the results once a lookup finishes
  useEffect(() => {
    if (hasSearched && !loading) resultsHeadingRef.current?.focus();
  }, [hasSearched, loading]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const idText = orderId.replace(/[#\s]/g, "");
    const id = Number(idText);
    const p = phone.trim();
    const errors: FieldErrors = {
      id: !idText
        ? "Vui lòng nhập mã đơn hàng."
        : Number.isInteger(id) && id > 0
          ? undefined
          : "Mã đơn hàng chỉ gồm chữ số, ví dụ: 1001.",
      phone: p ? undefined : "Vui lòng nhập số điện thoại đặt hàng.",
    };
    setFieldErrors(errors);
    if (errors.id || errors.phone) {
      (errors.id ? orderIdRef : phoneRef).current?.focus();
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const result = await trackOrder(id, p);
      setOrder(result);
    } catch (err) {
      console.error(err);
      setError("Không tra cứu được đơn hàng lúc này. Vui lòng thử lại sau ít phút.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const liveMessage = loading
    ? "Đang tra cứu đơn hàng…"
    : !hasSearched
      ? ""
      : error || (order ? `Đã tìm thấy đơn hàng #${order.id}.` : "Không tìm thấy đơn hàng.");

  return (
    <div className="quote-screen">
      <MobileTopBar title="Tra cứu đơn hàng" />

      {/* ── Search form ── */}
      <section className="quote-form-card max-w-160">
        <p className="text-body">Nhập mã đơn và số điện thoại để xem chi tiết đơn hàng của bạn.</p>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-2">
              <label>
                <span>Mã đơn hàng</span>
                <input
                  ref={orderIdRef}
                  name="orderId"
                  value={orderId}
                  onChange={(event) => {
                    setOrderId(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, id: undefined }));
                  }}
                  placeholder="Ví dụ: 1001"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(fieldErrors.id)}
                  aria-describedby={fieldErrors.id ? "track-order-id-error" : undefined}
                />
              </label>
              {fieldErrors.id ? (
                <p id="track-order-id-error" className="field-error">
                  {fieldErrors.id}
                </p>
              ) : null}
            </div>
            <div className="grid content-start gap-2">
              <label>
                <span>Số điện thoại</span>
                <input
                  ref={phoneRef}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Số điện thoại đặt hàng"
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "track-order-phone-error" : undefined}
                />
              </label>
              {fieldErrors.phone ? (
                <p id="track-order-phone-error" className="field-error">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>
          </div>
          <button type="submit" disabled={loading} className="button-primary w-full md:w-auto md:justify-self-start">
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                Đang tra cứu...
              </>
            ) : (
              <>
                <SearchIcon className="h-5 w-5" />
                Tra cứu đơn hàng
              </>
            )}
          </button>
        </form>
      </section>

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      {/* ── Results ── */}
      {hasSearched && !loading && (
        <section className="mobile-section mt-4">
          <div className="mobile-section-heading">
            <h2 ref={resultsHeadingRef} tabIndex={-1}>
              Kết quả tra cứu
            </h2>
          </div>

          {error ? (
            <div className="grid max-w-160 gap-4">
              <p className="mobile-alert">{error}</p>
              <HelpCard />
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
              <div className="grid grid-cols-1 gap-4">
                {/* ── Status + timeline ── */}
                <section className={CARD}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">Đơn hàng</p>
                      <h3 className="text-2xl">#{order.id}</h3>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-5">
                    <OrderTimeline status={order.status} />
                  </div>
                </section>

                {/* ── Products list ── */}
                {order.items.length > 0 && (
                  <section className={CARD}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg">Sản phẩm đã đặt</h3>
                      <span className="text-sm text-muted">{order.items.length} sản phẩm</span>
                    </div>
                    <ul className="mt-3 divide-y divide-line">
                      {order.items.map((item, i) => (
                        <OrderItemRow key={i} item={item} />
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* ── Customer info ── */}
                <section className={CARD}>
                  <h3 className="text-lg">Thông tin khách hàng</h3>
                  <div className="mt-2 divide-y divide-line">
                    <InfoRow icon={UserIcon} label="Họ tên" value={order.customerName} />
                    <InfoRow icon={PhoneIcon} label="Số điện thoại" value={order.customerPhone} />
                    {order.customerEmail && <InfoRow icon={ChatIcon} label="Email" value={order.customerEmail} />}
                    <InfoRow
                      icon={CalendarIcon}
                      label="Ngày đặt"
                      value={new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    />
                  </div>
                </section>

                {/* ── Total + note (the total is hidden together with prices) ── */}
                {(SITE.showPrices || order.note) && (
                  <section className={CARD}>
                    {SITE.showPrices && order.items.length > 1 && (
                      <ul className="mb-3 grid gap-1.5 border-b border-dashed border-line pb-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 text-sm text-body">
                            <span className="min-w-0 truncate">{item.productName}</span>
                            <span className="shrink-0 font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {SITE.showPrices && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-label">Tổng cộng</span>
                        <span className="text-2xl font-semibold text-price">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    )}

                    {order.note && (
                      <div className={`rounded-md bg-surface p-4 ${SITE.showPrices ? "mt-4" : ""}`}>
                        <p className="text-sm font-semibold text-label">Ghi chú</p>
                        <p className="mt-1 break-words text-sm text-body">{order.note}</p>
                      </div>
                    )}
                  </section>
                )}

                <HelpCard />
              </div>
            </div>
          ) : (
            <div className="grid max-w-160 gap-4">
              <div className={`${CARD} text-center`}>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
                  <SearchIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg">Không tìm thấy đơn hàng</h3>
                <p className="mt-1 text-sm text-body">Vui lòng kiểm tra lại mã đơn và số điện thoại đặt hàng.</p>
              </div>
              <HelpCard />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
