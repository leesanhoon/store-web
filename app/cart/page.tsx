"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clearCart, formatUnit, getCartItems, removeCartItem, updateCartItemQuantity, CartItem } from "@/lib/cart";
import QuoteActionButton from "@/components/QuoteActionButton";

type QuoteForm = {
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
};

const initialForm: QuoteForm = {
    fullName: "",
    phone: "",
    businessName: "",
    note: "",
};

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>(() => getCartItems());
    const [form, setForm] = useState<QuoteForm>(initialForm);
    const [message, setMessage] = useState("");

    const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

    const reloadCart = () => setItems(getCartItems());
    const handleClear = () => {
        clearCart();
        reloadCart();
    };

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                    <section className="panel-strong p-6 sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Giỏ hàng và báo giá</p>
                        <h1 className="font-display mt-3 text-3xl font-semibold text-header sm:text-4xl">
                            Kiểm tra đơn và gửi yêu cầu in
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                            Dùng localStorage để giữ giỏ hàng và lưu tạm yêu cầu báo giá. Khi backend có API đơn hàng, phần này sẽ
                            nối sang server.
                        </p>

                        <div className="mt-8 space-y-4">
                            {items.length === 0 ? (
                                <div className="rounded-[1.25rem] border border-dashed border-[#ddd6cb] bg-[#fbfaf7] p-8 text-center text-sm font-medium text-slate-600">
                                    Chưa có sản phẩm nào trong giỏ.
                                    <div className="mt-4">
                                        <Link href="/products" className="font-semibold text-slate-900 hover:text-brand-accent">
                                            Vào danh sách sản phẩm
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <article key={`${item.productId}-${item.unit}`} className="rounded-[1.25rem] border border-[#e6e0d8] bg-white p-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                                    {item.categoryName}
                                                </p>
                                                <h2 className="font-display text-xl font-semibold text-header">{item.name}</h2>
                                                <p className="text-sm text-slate-600">
                                                    Đơn vị: {formatUnit(item.unit)} | Đơn giá: {item.price.toLocaleString("vi-VN")}đ
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center rounded-full border border-[#ddd6cb] bg-[#fbfaf7]">
                                                    <button
                                                        type="button"
                                                        className="px-3 py-2 font-semibold"
                                                        onClick={() =>
                                                            setItems(
                                                                updateCartItemQuantity(
                                                                    item.productId,
                                                                    item.unit,
                                                                    Math.max(1, item.quantity - 1),
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        -
                                                    </button>
                                                    <span className="min-w-14 px-4 py-2 text-center font-semibold">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-2 font-semibold"
                                                        onClick={() =>
                                                            setItems(updateCartItemQuantity(item.productId, item.unit, item.quantity + 1))
                                                        }
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="font-semibold text-rose-600 hover:text-rose-700"
                                                    onClick={() => setItems(removeCartItem(item.productId, item.unit))}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="panel p-6">
                            <h2 className="font-display text-xl font-semibold text-header">Thông tin báo giá</h2>
                            <div className="mt-4 space-y-3">
                                <input
                                    className="input-modern rounded-full"
                                    placeholder="Họ tên"
                                    value={form.fullName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                                />
                                <input
                                    className="input-modern rounded-full"
                                    placeholder="Số điện thoại"
                                    value={form.phone}
                                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                                />
                                <input
                                    className="input-modern rounded-full"
                                    placeholder="Tên quán / thương hiệu"
                                    value={form.businessName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                                />
                                <textarea
                                    rows={5}
                                    className="input-modern rounded-[1.25rem]"
                                    placeholder="Ghi chú in ấn, số lượng, màu in, vị trí logo..."
                                    value={form.note}
                                    onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                                />
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
                                <QuoteActionButton
                                    fullName={form.fullName}
                                    phone={form.phone}
                                    businessName={form.businessName}
                                    note={form.note}
                                    items={items}
                                    onCreated={() => {
                                        setMessage("Đã lưu yêu cầu báo giá cục bộ. Màn quản lý đơn hàng có thể xem dữ liệu này.");
                                        setForm(initialForm);
                                    }}
                                >
                                    Lưu yêu cầu báo giá
                                </QuoteActionButton>
                                <a
                                    href="https://zalo.me/"
                                    className="button-secondary border-[#d8c2aa] bg-[#fff8ef] text-brand-accent hover:border-brand-accent"
                                >
                                    Gửi qua Zalo
                                </a>
                                <Link href="/track-order" className="button-secondary">
                                    Tra cứu đơn
                                </Link>
                            </div>
                            {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
                        </div>

                        <div className="panel p-6">
                            <h2 className="font-display text-xl font-semibold text-header">Tổng cộng</h2>
                            <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                                <div className="flex justify-between">
                                    <span>Sản phẩm</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tạm tính</span>
                                    <span>{total.toLocaleString("vi-VN")}đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Phí vận chuyển</span>
                                    <span>Thỏa thuận</span>
                                </div>
                            </div>
                            <hr className="my-4 border-dashed border-[#e6e0d8]" />
                            <div className="flex justify-between text-lg font-semibold text-header">
                                <span>Tổng tiền</span>
                                <span>{total.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="mt-5 flex flex-col gap-3">
                                <button type="button" onClick={handleClear} className="button-secondary">
                                    Xóa giỏ
                                </button>
                                <Link href="/products" className="button-primary">
                                    Thêm sản phẩm
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
