"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import OrderTimeline from "@/components/OrderTimeline";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { SearchIcon } from "@/components/mobile-store/icons";
import { findOrderByIdAndPhone, findOrdersByPhone } from "@/lib/orders";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [searchToken, setSearchToken] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const order = hasSearched ? findOrderByIdAndPhone(orderId, phone) : null;
  const relatedOrders = hasSearched ? findOrdersByPhone(phone) : [];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
    setSearchToken((value) => value + 1);
  };

  return (
    <MobileAppShell>
      <div className="quote-screen">
        <MobileTopBar title="Tra cứu đơn hàng" backHref="/" backLabel="Quay lại trang chủ" />

        <section className="quote-form-card">
          <p className="text-sm leading-6 text-slate-600">
            Nhập mã đơn và số điện thoại để xem tiến độ thiết kế, duyệt mẫu, sản xuất và giao hàng.
          </p>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <label>
              <span>Mã đơn</span>
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Ví dụ RQ-123456"
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
            <button type="submit" className="button-primary w-full">
              <span className="inline-flex items-center justify-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Tra cứu
              </span>
            </button>
          </form>
        </section>

        {hasSearched ? (
          <section className="mobile-section">
            <div className="mobile-section-heading">
              <h2>Kết quả tra cứu</h2>
            </div>

            {order ? (
              <article className="quote-form-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {order.id}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-header">
                      {order.businessName || order.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{order.phone}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {order.status}
                  </span>
                </div>
                <div className="mt-4">
                  <OrderTimeline status={order.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {order.note || "Không có ghi chú."}
                </p>
              </article>
            ) : (
              <p className="mobile-alert">
                Chưa tìm thấy đơn. Hãy kiểm tra lại mã đơn và số điện thoại.
              </p>
            )}
          </section>
        ) : null}

        {hasSearched && relatedOrders.length > 0 ? (
          <section className="mobile-section">
            <div className="mobile-section-heading">
              <h2>Đơn liên quan</h2>
            </div>
            <div className="space-y-3">
              {relatedOrders.map((item) => (
                <Link
                  key={item.id}
                  href={`/track-order?orderId=${item.id}&phone=${item.phone}&token=${searchToken}`}
                  className="quote-form-card block"
                  onClick={() => {
                    setOrderId(item.id);
                    setPhone(item.phone);
                    setHasSearched(true);
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.id}
                  </p>
                  <p className="mt-1 font-semibold text-header">
                    {item.businessName || item.fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.status}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
