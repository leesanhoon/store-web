"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clearCart, formatUnit, getCartItemKey, getCartItems, removeCartItem, updateCartItemQuantity, type CartItem } from "@/lib/cart";
import QuoteActionButton from "@/components/QuoteActionButton";

type QuoteForm = { fullName: string; phone: string; businessName: string; note: string };
const initialForm: QuoteForm = { fullName: "", phone: "", businessName: "", note: "" };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => getCartItems());
  const [form, setForm] = useState<QuoteForm>(initialForm);
  const [message, setMessage] = useState("");

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalLines = items.length;

  const reloadCart = () => setItems(getCartItems());
  const handleClear = () => { clearCart(); reloadCart(); };
  const gmailSubject = encodeURIComponent("Yêu cầu báo giá ly in");
  const gmailBody = encodeURIComponent(`Họ tên: ${form.fullName}\nSĐT: ${form.phone}\nDoanh nghiệp: ${form.businessName}\nGhi chú: ${form.note}\nSố dòng giỏ: ${totalLines}\nTạm tính: ${total.toLocaleString("vi-VN")}đ`);
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${gmailSubject}&body=${gmailBody}`;

  return (
    <div className="surface-gradient">
      <div className="page-shell py-6 sm:py-8">
        <section className="panel-strong overflow-hidden">
          <div className="grid gap-6 border-b border-[#e5ebf2] p-6 sm:p-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Giỏ hàng và báo giá</p>
              <h1 className="text-3xl font-semibold tracking-tight text-header sm:text-4xl">Kiểm tra đơn và gửi yêu cầu in</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Mỗi dòng trong giỏ là một cấu hình sản phẩm riêng. Phần tổng kết giúp bạn xác nhận số lượng, đơn vị tính và giá trị tạm tính trước khi gửi brief.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Dòng</p><p className="mt-2 text-2xl font-semibold text-header">{totalLines}</p></div>
              <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Số lượng</p><p className="mt-2 text-2xl font-semibold text-header">{totalQuantity.toLocaleString("vi-VN")}</p></div>
              <div className="rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tạm tính</p><p className="mt-2 text-2xl font-semibold text-header">{total.toLocaleString("vi-VN")}đ</p></div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_380px]">
            <section className="min-w-0 space-y-4">
              {items.length === 0 ? (
                <div className="panel p-8 text-sm font-medium text-slate-600">Giỏ đang trống. Hãy duyệt sản phẩm trước rồi quay lại gửi brief.</div>
              ) : items.map((item) => {
                const key = getCartItemKey(item);
                return (
                  <article key={key} className="rounded-[1.5rem] border border-[#e5ebf2] bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.categoryName}</p>
                        <h2 className="text-xl font-semibold text-header">{item.name}</h2>
                        <p className="text-sm leading-6 text-slate-600">{item.configuration.cupModel} · {item.configuration.size} · {item.configuration.material} · {item.configuration.printMethod}</p>
                        <p className="text-sm font-medium text-slate-500">{formatUnit(item.unit)} × {item.quantity.toLocaleString("vi-VN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-header">{(item.price * item.quantity).toLocaleString("vi-VN")}đ</p>
                        <p className="text-sm text-slate-500">{item.price.toLocaleString("vi-VN")}đ / sản phẩm</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                      <input type="number" min={1} value={item.quantity} onChange={(event) => { updateCartItemQuantity(key, Number(event.target.value)); reloadCart(); }} className="input-modern" />
                      <button type="button" onClick={() => { removeCartItem(key); reloadCart(); }} className="button-secondary">Xóa</button>
                      <button type="button" onClick={() => reloadCart()} className="button-secondary">Cập nhật</button>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="space-y-4">
              <div className="panel p-6">
                <h2 className="text-xl font-semibold text-header">Thông tin báo giá</h2>
                <div className="mt-4 grid gap-3">
                  <input className="input-modern" placeholder="Họ và tên" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
                  <input className="input-modern" placeholder="Số điện thoại" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  <input className="input-modern" placeholder="Tên doanh nghiệp" value={form.businessName} onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))} />
                  <label className="grid gap-2 text-sm font-medium text-header">Ghi chú<textarea rows={5} className="input-modern rounded-[1.25rem]" value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} /></label>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <QuoteActionButton fullName={form.fullName} phone={form.phone} businessName={form.businessName} note={form.note} items={items} onCreated={() => { setMessage("Đã lưu yêu cầu báo giá cục bộ và mở luồng gửi Gmail."); setForm(initialForm); }}>
                    Gửi yêu cầu báo giá
                  </QuoteActionButton>
                  <a href={gmailHref} target="_blank" rel="noreferrer" className="button-secondary">Mở Gmail để gửi</a>
                  <Link href="/track-order" className="button-secondary">Tra cứu đơn</Link>
                </div>
                {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
              </div>

              <div className="panel p-6">
                <h2 className="text-xl font-semibold text-header">Tổng kết</h2>
                <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                  <div className="flex justify-between"><span>Dòng sản phẩm</span><span>{totalLines}</span></div>
                  <div className="flex justify-between"><span>Tổng số lượng ly</span><span>{totalQuantity.toLocaleString("vi-VN")}</span></div>
                  <div className="flex justify-between"><span>Tạm tính</span><span>{total.toLocaleString("vi-VN")}đ</span></div>
                  <div className="flex justify-between"><span>Phí vận chuyển</span><span>Thỏa thuận</span></div>
                </div>
                <hr className="my-4 border-dashed border-[#e5ebf2]" />
                <div className="flex justify-between text-lg font-semibold text-header"><span>Tổng tiền</span><span>{total.toLocaleString("vi-VN")}đ</span></div>
                <div className="mt-5 flex flex-col gap-3">
                  <button type="button" onClick={handleClear} className="button-secondary">Xóa giỏ</button>
                  <Link href="/products" className="button-primary">Thêm sản phẩm</Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
