"use client";

import { useState } from "react";
import Link from "next/link";
import { findOrderByIdAndPhone, findOrdersByPhone } from "@/lib/orders";
import OrderTimeline from "@/components/OrderTimeline";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [searchToken, setSearchToken] = useState(0);

  const order = findOrderByIdAndPhone(orderId, phone);
  const relatedOrders = findOrdersByPhone(phone);

  return (
    <div className="surface-gradient">
      <div className="page-shell py-6 sm:py-8">
        <section className="panel-strong p-6 sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Tra cứu đơn</p>
          <h1 className="mt-3 text-4xl font-semibold text-header">Theo dõi trạng thái đơn in</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">Nhập mã đơn và số điện thoại để xem tiến độ thiết kế, duyệt mẫu, sản xuất và giao hàng.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Mã đơn (ví dụ RQ-123456)" className="input-modern" />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Số điện thoại" className="input-modern" />
            <button type="button" onClick={() => setSearchToken((value) => value + 1)} className="button-primary">Tra cứu</button>
          </div>
        </section>

        <section className="section-gap grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {order ? (
              <article className="panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{order.id}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-header">{order.businessName || order.fullName}</h2>
                    <p className="mt-2 text-sm text-slate-600">{order.phone}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{order.status}</div>
                </div>
                <div className="mt-6"><OrderTimeline status={order.status} /></div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ghi chú</p><p className="mt-2 text-sm leading-7 text-slate-600">{order.note || "Không có ghi chú."}</p></div>
                  <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cập nhật gần nhất</p><p className="mt-2 text-sm leading-7 text-slate-600">Các trạng thái được sắp theo tiến trình thiết kế → duyệt mẫu → sản xuất → giao hàng.</p></div>
                </div>
              </article>
            ) : (
              <div className="panel p-6 text-sm font-medium text-slate-600">Chưa tìm thấy đơn. Hãy nhập đúng mã đơn và số điện thoại.</div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="panel bg-[#f8fafc] p-6">
              <h2 className="text-xl font-semibold text-header">Đơn liên quan</h2>
              <div className="mt-4 space-y-3">
                {relatedOrders.length === 0 ? (
                  <p className="text-sm font-medium text-slate-600">Chưa có đơn liên quan.</p>
                ) : (
                  relatedOrders.map((item) => (
                    <Link key={item.id} href={`/track-order?orderId=${item.id}&phone=${item.phone}&token=${searchToken}`} className="block rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.id}</p>
                      <p className="mt-1 font-semibold text-header">{item.businessName || item.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.status}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="text-xl font-semibold text-header">Gợi ý</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">Nếu chưa có mã đơn, hãy kiểm tra email/Zalo hoặc liên hệ bộ phận tư vấn để nhận mã và mốc cập nhật mới nhất.</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
