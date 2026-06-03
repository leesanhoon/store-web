"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    clearCart,
    formatUnit,
    getCartItemKey,
    getCartItems,
    removeCartItem,
    updateCartItemQuantity,
    type CartItem,
} from "@/lib/cart";
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
    const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const totalLines = items.length;

    const reloadCart = () => setItems(getCartItems());
    const handleClear = () => {
        clearCart();
        reloadCart();
    };

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <section className="panel-strong overflow-hidden">
                    <div className="grid gap-6 border-b border-[#e5ddd1] p-6 sm:p-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Giỏ hàng và báo giá</p>
                            <h1 className="font-display text-3xl font-semibold text-header sm:text-4xl">Kiểm tra đơn và gửi yêu cầu in</h1>
                            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                Mỗi dòng trong giỏ là một cấu hình sản phẩm riêng. Badge góc phải đếm số line, còn phần tổng kết vẫn
                                hiển thị tổng số lượng cup và giá trị tạm tính.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-[#e5ddd1] bg-[#fcfaf7] p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Dòng</p>
                                <p className="mt-2 text-2xl font-semibold text-header">{totalLines}</p>
                            </div>
                            <div className="rounded-2xl border border-[#e5ddd1] bg-[#fcfaf7] p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Số lượng</p>
                                <p className="mt-2 text-2xl font-semibold text-header">{totalQuantity.toLocaleString("vi-VN")}</p>
                            </div>
                            <div className="rounded-2xl border border-[#e5ddd1] bg-[#fcfaf7] p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tạm tính</p>
                                <p className="mt-2 text-2xl font-semibold text-header">{total.toLocaleString("vi-VN")}đ</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_380px]">
                        <section className="min-w-0 space-y-4">
                            {items.length === 0 ? (
                                <div className="rounded-[1.25rem] border border-dashed border-[#dbcfc0] bg-[#fcfaf7] p-8 text-center text-sm font-medium text-slate-600">
                                    Chưa có sản phẩm nào trong giỏ.
                                    <div className="mt-4">
                                        <Link href="/products" className="font-semibold text-slate-900 hover:text-brand-accent">
                                            Vào danh sách sản phẩm
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const itemKey = getCartItemKey(item);

                                    return (
                                        <article
                                            key={itemKey}
                                            className="rounded-[1.25rem] border border-[#e5ddd1] bg-white p-5 shadow-[0_12px_28px_-24px_rgba(17,24,39,0.22)]"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                                            {item.categoryName}
                                                        </p>
                                                        <span className="rounded-full bg-[#fcfaf7] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                            {formatUnit(item.unit)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h2 className="font-display text-xl font-semibold text-header">{item.name}</h2>
                                                        <p className="text-sm text-slate-600">Đơn giá {item.price.toLocaleString("vi-VN")}đ</p>
                                                    </div>

                                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                                        <span className="rounded-2xl bg-[#fcfaf7] px-3 py-2 text-xs font-medium text-slate-600">
                                                            Mẫu: {item.configuration.cupModel}
                                                        </span>
                                                        <span className="rounded-2xl bg-[#fcfaf7] px-3 py-2 text-xs font-medium text-slate-600">
                                                            Size: {item.configuration.size}
                                                        </span>
                                                        <span className="rounded-2xl bg-[#fcfaf7] px-3 py-2 text-xs font-medium text-slate-600">
                                                            Chất liệu: {item.configuration.material}
                                                        </span>
                                                        <span className="rounded-2xl bg-[#fcfaf7] px-3 py-2 text-xs font-medium text-slate-600">
                                                            In: {item.configuration.printMethod}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">
                                                    <div className="flex items-center rounded-full border border-[#dbcfc0] bg-[#fcfaf7]">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 font-semibold"
                                                            onClick={() => setItems(updateCartItemQuantity(itemKey, Math.max(1, item.quantity - 1000)))}
                                                            aria-label={`Giảm số lượng ${item.name}`}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="min-w-20 px-4 py-2 text-center font-semibold">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 font-semibold"
                                                            onClick={() => setItems(updateCartItemQuantity(itemKey, item.quantity + 1000))}
                                                            aria-label={`Tăng số lượng ${item.name}`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                                                        onClick={() => setItems(removeCartItem(itemKey))}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </section>

                        <aside className="space-y-6">
                            <div className="panel p-6">
                                <h2 className="font-display text-xl font-semibold text-header">Thông tin báo giá</h2>
                                <div className="mt-4 space-y-3">
                                    <label className="grid gap-2 text-sm font-medium text-header">
                                        Họ tên
                                        <input
                                            className="input-modern rounded-full"
                                            value={form.fullName}
                                            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-header">
                                        Số điện thoại
                                        <input
                                            className="input-modern rounded-full"
                                            value={form.phone}
                                            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-header">
                                        Tên quán / thương hiệu
                                        <input
                                            className="input-modern rounded-full"
                                            value={form.businessName}
                                            onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-medium text-header">
                                        Ghi chú
                                        <textarea
                                            rows={5}
                                            className="input-modern rounded-[1.25rem]"
                                            value={form.note}
                                            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                                        />
                                    </label>
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
                                <h2 className="font-display text-xl font-semibold text-header">Tổng kết</h2>
                                <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Dòng sản phẩm</span>
                                        <span>{totalLines}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tổng số lượng ly</span>
                                        <span>{totalQuantity.toLocaleString("vi-VN")}</span>
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
                                <hr className="my-4 border-dashed border-[#e5ddd1]" />
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
                </section>
            </div>
        </div>
    );
}
