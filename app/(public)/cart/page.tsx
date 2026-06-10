"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/mobile-store/icons";
import {
    clearCart,
    formatUnit,
    getCartItemKey,
    getCartItems,
    removeCartItem,
    updateCartItemQuantity,
    type CartItem,
} from "@/lib/cart";
import { createOrder, type CreateOrderRequest } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/products/display";

type OrderForm = {
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
};

const initialForm: OrderForm = {
    fullName: "",
    phone: "",
    businessName: "",
    note: "",
};

function getItemUnitPrice(item: CartItem) {
    return item.price + (item.configuration.lidUnitPrice ?? 0);
}

function getItemSubtotal(item: CartItem) {
    return getItemUnitPrice(item) * item.quantity;
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>(() => getCartItems());
    const [form, setForm] = useState<OrderForm>(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const totalAmount = useMemo(
        () => items.reduce((sum, item) => sum + getItemSubtotal(item), 0),
        [items],
    );

    const reloadCart = () => setItems(getCartItems());

    const handleQuantityChange = (item: CartItem, delta: number) => {
        const key = getCartItemKey(item);
        const newQuantity = item.quantity + delta;
        if (newQuantity < 100) return;
        updateCartItemQuantity(key, newQuantity);
        reloadCart();
    };

    const handleRemoveItem = (item: CartItem) => {
        removeCartItem(getCartItemKey(item));
        reloadCart();
    };

    const handleClear = () => {
        clearCart();
        setItems([]);
    };

    const canSubmit =
        items.length > 0 &&
        form.fullName.trim().length > 0 &&
        form.phone.trim().length > 0 &&
        !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError("");

        const businessName = form.businessName.trim();
        const note = form.note.trim();
        const payload: CreateOrderRequest = {
            customerName: form.fullName.trim(),
            customerPhone: form.phone.trim(),
            customerEmail: null,
            note: [
                businessName ? `Quán: ${businessName}` : "",
                note,
            ]
                .filter(Boolean)
                .join(". ") || null,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: getItemUnitPrice(item),
                materialId: null,
                printTypeId: null,
            })),
        };

        try {
            const result = await createOrder(payload);
            setSuccessOrderId(result.id);
            clearCart();
            setItems([]);
            setForm(initialForm);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể gửi đặt hàng. Vui lòng thử lại.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (successOrderId !== null) {
        return (
            <MobileAppShell>
                <div className="quote-screen">
                    <MobileTopBar
                        title="Đặt hàng thành công"
                        backHref="/products"
                        backLabel="Quay lại danh mục"
                    />
                    <section className="cart-success">
                        <div className="cart-success-icon">✓</div>
                        <h2>Đặt hàng thành công!</h2>
                        <p>
                            Mã đơn hàng của bạn:{" "}
                            <strong>#{successOrderId}</strong>
                        </p>
                        <p>
                            Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận
                            đơn hàng.
                        </p>
                        <Link href="/products" className="button-primary">
                            Tiếp tục mua sắm
                        </Link>
                    </section>
                </div>
            </MobileAppShell>
        );
    }

    return (
        <MobileAppShell>
            <div className="quote-screen">
                <MobileTopBar
                    title="Giỏ hàng"
                    backHref="/products"
                    backLabel="Quay lại danh mục"
                />

                {items.length === 0 ? (
                    <section className="cart-empty">
                        <p>Giỏ hàng trống</p>
                        <Link href="/products" className="button-primary">
                            Xem sản phẩm
                        </Link>
                    </section>
                ) : (
                    <>
                        <section className="cart-items-list">
                            {items.map((item) => {
                                const unitPrice = getItemUnitPrice(item);
                                const subtotal = getItemSubtotal(item);
                                const key = getCartItemKey(item);
                                return (
                                    <article key={key} className="cart-item">
                                        <div className="cart-item-image">
                                            {item.imageSrc ? (
                                                <Image
                                                    src={item.imageSrc}
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                />
                                            ) : (
                                                <div className="cart-item-placeholder" />
                                            )}
                                        </div>
                                        <div className="cart-item-details">
                                            <div className="cart-item-header">
                                                <strong>{item.name}</strong>
                                                <button
                                                    type="button"
                                                    className="cart-item-remove"
                                                    aria-label="Xóa"
                                                    onClick={() =>
                                                        handleRemoveItem(item)
                                                    }
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <span className="cart-item-config">
                                                {item.configuration.size} ·{" "}
                                                {item.configuration.printMethod}
                                                {item.configuration.lidOption &&
                                                item.configuration.lidOption !==
                                                    "Không nắp"
                                                    ? ` · ${item.configuration.lidOption}`
                                                    : ""}
                                            </span>
                                            <span className="cart-item-unit-price">
                                                {formatCurrency(unitPrice)} /{" "}
                                                {formatUnit(item.unit)}
                                            </span>
                                            <div className="cart-item-bottom">
                                                <div className="quantity-stepper cart-quantity">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item,
                                                                -100,
                                                            )
                                                        }
                                                        aria-label="Giảm số lượng"
                                                    >
                                                        <MinusIcon className="h-4 w-4" />
                                                    </button>
                                                    <strong>
                                                        {item.quantity.toLocaleString(
                                                            "vi-VN",
                                                        )}
                                                    </strong>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item,
                                                                100,
                                                            )
                                                        }
                                                        aria-label="Tăng số lượng"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <strong className="cart-item-subtotal">
                                                    {formatCurrency(subtotal)}
                                                </strong>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleClear}
                                className="cart-clear-btn"
                            >
                                Xóa toàn bộ giỏ hàng
                            </button>
                        </section>

                        <section className="cart-summary">
                            <div className="cart-summary-row">
                                <span>
                                    Tổng cộng ({items.length} sản phẩm)
                                </span>
                                <strong>{formatCurrency(totalAmount)}</strong>
                            </div>
                        </section>

                        <section className="quote-form-card">
                            <h3 className="cart-form-title">
                                Thông tin đặt hàng
                            </h3>
                            <label>
                                <span>Họ tên *</span>
                                <input
                                    value={form.fullName}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            fullName: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập họ tên"
                                />
                            </label>
                            <label>
                                <span>Số điện thoại *</span>
                                <input
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập số điện thoại"
                                    inputMode="tel"
                                />
                            </label>
                            <label>
                                <span>Tên quán / doanh nghiệp</span>
                                <input
                                    value={form.businessName}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            businessName: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tên quán (nếu có)"
                                />
                            </label>
                            <label>
                                <span>Ghi chú</span>
                                <textarea
                                    value={form.note}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            note: e.target.value,
                                        }))
                                    }
                                    placeholder="Ghi chú thêm về đơn hàng..."
                                    rows={3}
                                />
                            </label>
                        </section>

                        <div className="quote-actions">
                            <button
                                type="button"
                                disabled={!canSubmit}
                                onClick={handleSubmit}
                                className="button-primary w-full"
                            >
                                {submitting
                                    ? "Đang gửi..."
                                    : `Gửi đặt hàng · ${formatCurrency(totalAmount)}`}
                            </button>
                            {error ? (
                                <p className="cart-error">{error}</p>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </MobileAppShell>
    );
}
