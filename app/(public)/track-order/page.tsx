"use client";

import { useState, type FormEvent } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { SearchIcon } from "@/components/mobile-store/icons";
import { trackOrder, ORDER_STATUS_LABELS, type OrderDetailDto, type OrderStatus } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/products/display";

function StatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUS_LABELS[status] ?? status;
  const classes =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "cancelled"
        ? "bg-rose-100 text-rose-700"
        : status === "shipping"
          ? "bg-blue-100 text-blue-700"
          : status === "confirmed"
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

const STATUS_STEPS: OrderStatus[] = ["draft", "confirmed", "shipping", "completed"];

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-600">
        Đơn hàng đã bị hủy
      </div>
    );
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`h-2 w-full rounded-full ${active ? "bg-emerald-500" : "bg-slate-200"}`}
            />
            <span className={`text-[11px] font-semibold ${active ? "text-emerald-700" : "text-slate-400"}`}>
              {ORDER_STATUS_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

        <section className="quote-form-card">
          <p className="text-sm leading-6 text-slate-600">
            Nhập mã đơn và số điện thoại để xem trạng thái đơn hàng.
          </p>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <label>
              <span>Mã đơn</span>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Ví dụ 123"
                inputMode="numeric"
              />
            </label>
            <label>
              <span>Số điện thoại</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Nhập số điện thoại"
                inputMode="tel"
              />
            </label>
            <button type="submit" disabled={loading} className="button-primary w-full">
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? (
                  "Đang tra cứu..."
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5" />
                    Tra cứu
                  </>
                )}
              </span>
            </button>
          </form>
        </section>

        {hasSearched && !loading ? (
          <section className="mobile-section">
            <div className="mobile-section-heading">
              <h2>Kết quả tra cứu</h2>
            </div>

            {error ? (
              <p className="mobile-alert">{error}</p>
            ) : order ? (
              <article className="quote-form-card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Đơn #{order.id}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-header">
                      {order.customerName}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {new Date(order.createdAtUtc).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <OrderProgress status={order.status} />

                {order.items.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700">Sản phẩm</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{item.productName}</p>
                          <p className="text-xs text-slate-500">SL: {item.quantity.toLocaleString("vi-VN")}</p>
                        </div>
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-600">Tổng cộng</span>
                  <strong className="text-base text-[#101a36]">{formatCurrency(order.totalAmount)}</strong>
                </div>

                {order.note ? (
                  <p className="text-sm leading-6 text-slate-600">
                    <span className="font-semibold">Ghi chú:</span> {order.note}
                  </p>
                ) : null}
              </article>
            ) : (
              <p className="mobile-alert">
                Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
