"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { SearchIcon } from "@/components/mobile-store/icons";
import { trackOrder, ORDER_STATUS_LABELS, type OrderDetailDto, type OrderStatus, type OrderItemDto } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/products/display";

/* ── Status colour map ── */
const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; ring: string; dot: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200", dot: "bg-slate-400" },
  confirmed: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" },
  shipping: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", dot: "bg-sky-500" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUS_LABELS[status] ?? status;
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
}

/* ── Timeline ── */
const STATUS_STEPS: OrderStatus[] = ["draft", "confirmed", "shipping", "completed"];
const STEP_ICONS = ["📋", "✓", "🚚", "✨"];

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/40 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-lg">✕</span>
        <div>
          <p className="text-sm font-bold text-rose-700">Đơn hàng đã bị hủy</p>
          <p className="mt-0.5 text-xs text-rose-500">Liên hệ cửa hàng để biết thêm chi tiết</p>
        </div>
      </div>
    );
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="grid grid-cols-4 gap-0">
      {STATUS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_STEPS.length - 1;
        return (
          <div key={step} className="relative flex flex-col items-center">
            {/* connector line */}
            {!isLast && (
              <div className="absolute top-[18px] left-[calc(50%+14px)] h-[3px] w-[calc(100%-28px)]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    index < currentIndex ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                  style={{ transitionTimingFunction: "var(--ease-spring)" }}
                />
              </div>
            )}
            {/* dot */}
            <div
              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                done
                  ? isCurrent
                    ? "bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                    : "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              {done ? STEP_ICONS[index] : (index + 1)}
            </div>
            {/* label */}
            <span
              className={`mt-2 text-center text-[10px] font-bold leading-tight ${
                done ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Scroll-reveal wrapper ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) blur(0)" : "translateY(18px)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: `opacity 0.7s var(--ease-spring) ${delay}ms, transform 0.7s var(--ease-spring) ${delay}ms, filter 0.7s var(--ease-spring) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Product item card ── */
function OrderItemCard({ item, index }: { item: OrderItemDto; index: number }) {
  const lineTotal = item.unitPrice * item.quantity;
  return (
    <Reveal delay={index * 80}>
      {/* Double-Bezel outer shell */}
      <div className="rounded-[22px] bg-black/[0.03] p-[5px] ring-1 ring-[--ring-hairline]">
        {/* Inner core */}
        <div className="rounded-[calc(22px-5px)] bg-white p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          {/* Product name & line total */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-extrabold leading-snug text-[--color-ink]">
                {item.productName}
              </p>
            </div>
            <span className="shrink-0 font-display text-[15px] font-extrabold text-[--color-price]">
              {formatCurrency(lineTotal)}
            </span>
          </div>

          {/* Detail chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <DetailChip label="Số lượng" value={item.quantity.toLocaleString("vi-VN")} />
            <DetailChip label="Đơn giá" value={formatCurrency(item.unitPrice)} />
            {item.materialName && (
              <DetailChip label="Chất liệu" value={item.materialName} />
            )}
            {item.printTypeName && (
              <DetailChip label="Kiểu in" value={item.printTypeName} />
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[--color-brand-accent-soft] px-2.5 py-1 text-[11px] font-semibold text-[--color-ink]">
      <span className="text-slate-500">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

/* ── Info row helper ── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--color-brand-accent-soft] text-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        <p className="text-sm font-bold text-[--color-ink]">{value}</p>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(orderId.trim());
    const p = phone.trim();
    if (!id || !p) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const result = await trackOrder(id, p);
      setOrder(result);
    } catch {
      setError("Không thể kết nối server. Vui lòng thử lại.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileAppShell>
      <div className="quote-screen">
        <MobileTopBar title="Tra cứu đơn hàng" backHref="/" backLabel="Quay lại trang chủ" />

        {/* ── Search form ── */}
        <section className="quote-form-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--color-brand-accent-soft] text-lg">
              🔍
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Nhập mã đơn và số điện thoại để xem chi tiết đơn hàng của bạn.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <label>
              <span>Mã đơn hàng</span>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Ví dụ: 1001"
                inputMode="numeric"
              />
            </label>
            <label>
              <span>Số điện thoại</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Nhập số điện thoại đặt hàng"
                inputMode="tel"
              />
            </label>
            <button type="submit" disabled={loading} className="button-primary w-full">
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tra cứu...
                  </span>
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5" />
                    Tra cứu đơn hàng
                  </>
                )}
              </span>
            </button>
          </form>
        </section>

        {/* ── Results ── */}
        {hasSearched && !loading && (
          <section className="mobile-section">
            <div className="mobile-section-heading">
              <h2>Kết quả tra cứu</h2>
            </div>

            {error ? (
              <p className="mobile-alert">{error}</p>
            ) : order ? (
              <div className="grid gap-4">
                {/* ── Order header card ── */}
                <Reveal>
                  <div className="rounded-[22px] bg-black/[0.03] p-[5px] ring-1 ring-[--ring-hairline]">
                    <div className="rounded-[calc(22px-5px)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                      {/* Top banner with status */}
                      <div className="flex items-start justify-between gap-3 p-5 pb-4">
                        <div>
                          <p className="rounded-full bg-[--color-brand-accent-soft] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[--color-brand-accent] inline-block">
                            Đơn hàng
                          </p>
                          <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[--color-ink]">
                            #{order.id}
                          </h3>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      {/* Timeline */}
                      <div className="px-5 pb-5">
                        <OrderTimeline status={order.status} />
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* ── Customer info card ── */}
                <Reveal delay={100}>
                  <div className="rounded-[22px] bg-black/[0.03] p-[5px] ring-1 ring-[--ring-hairline]">
                    <div className="rounded-[calc(22px-5px)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Thông tin khách hàng
                      </p>
                      <div className="mt-3 grid gap-0 divide-y divide-slate-100">
                        <InfoRow icon="👤" label="Họ tên" value={order.customerName} />
                        <InfoRow icon="📱" label="Số điện thoại" value={order.customerPhone} />
                        {order.customerEmail && (
                          <InfoRow icon="✉️" label="Email" value={order.customerEmail} />
                        )}
                        <InfoRow
                          icon="📅"
                          label="Ngày đặt"
                          value={new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* ── Products list ── */}
                {order.items.length > 0 && (
                  <Reveal delay={200}>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Sản phẩm đã đặt
                        </p>
                        <span className="rounded-full bg-[--color-ink] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          {order.items.length} sản phẩm
                        </span>
                      </div>
                      {order.items.map((item, i) => (
                        <OrderItemCard key={i} item={item} index={i} />
                      ))}
                    </div>
                  </Reveal>
                )}

                {/* ── Total + note card ── */}
                <Reveal delay={300}>
                  <div className="rounded-[22px] bg-black/[0.03] p-[5px] ring-1 ring-[--ring-hairline]">
                    <div className="rounded-[calc(22px-5px)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                      {/* Subtotal breakdown */}
                      {order.items.length > 1 && (
                        <div className="mb-3 grid gap-1.5 pb-3 border-b border-dashed border-slate-200">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm text-slate-500">
                              <span className="truncate max-w-[60%]">{item.productName}</span>
                              <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Grand total */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Tổng cộng</span>
                        <span className="font-display text-xl font-extrabold text-[--color-price]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {/* Note */}
                      {order.note && (
                        <div className="mt-4 rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-200/50">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                            Ghi chú
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
                            {order.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>

                {/* ── Help CTA ── */}
                <Reveal delay={400}>
                  <div className="rounded-[22px] bg-gradient-to-br from-[--color-ink] to-[#1c2a4d] p-5 text-center">
                    <p className="text-sm font-bold text-white/90">Cần hỗ trợ về đơn hàng?</p>
                    <p className="mt-1 text-xs text-white/50">
                      Liên hệ cửa hàng qua Zalo hoặc gọi trực tiếp
                    </p>
                    <a
                      href="tel:0901234567"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition-all duration-500 active:scale-[0.98]"
                      style={{ transitionTimingFunction: "var(--ease-spring)" }}
                    >
                      📞 Gọi cửa hàng
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">→</span>
                    </a>
                  </div>
                </Reveal>
              </div>
            ) : (
              <Reveal>
                <div className="rounded-[22px] bg-black/[0.03] p-[5px] ring-1 ring-[--ring-hairline]">
                  <div className="rounded-[calc(22px-5px)] bg-white p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                      📭
                    </span>
                    <p className="mt-4 font-display text-base font-extrabold text-[--color-ink]">
                      Không tìm thấy đơn hàng
                    </p>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Vui lòng kiểm tra lại mã đơn và số điện thoại đặt hàng.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}
          </section>
        )}
      </div>
    </MobileAppShell>
  );
}
