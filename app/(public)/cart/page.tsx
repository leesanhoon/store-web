"use client";

import Image from "next/image";
import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { QUANTITY_OPTIONS } from "@/components/cart/CartConfiguratorProvider";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay, { InlineSpinner } from "@/components/ui/LoadingOverlay";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
    CartIcon,
    ChatIcon,
    CheckIcon,
    CopyIcon,
    PhoneIcon,
    TrashIcon,
} from "@/components/mobile-store/icons";
import {
    clearCart,
    getCartItemKey,
    removeCartItem,
    updateCartItemQuantity,
    type CartItem,
} from "@/lib/cart";
import { createOrder, type CreateOrderRequest } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/products/display";
import { SITE } from "@/lib/site";
import { useCartItems } from "@/lib/use-cart";
import CartLoading from "./loading";

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const SUBMIT_ERROR =
    "Không gửi được yêu cầu báo giá. Vui lòng thử lại sau ít phút.";

const NEXT_STEPS = [
    {
        title: "Xác nhận yêu cầu",
        text: "Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận đơn hàng. Phí in sẽ được báo trong báo giá.",
    },
    {
        title: "Duyệt thiết kế miễn phí",
        text: "Bạn xem và duyệt mẫu logo trên ly trước khi sản xuất.",
    },
    {
        title: "Sản xuất & giao 3-5 ngày",
        text: "In nhanh 3-5 ngày, giao toàn quốc.",
    },
];

type OrderForm = {
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
};

type FieldErrors = Partial<Record<keyof OrderForm, string>>;

const initialForm: OrderForm = {
    fullName: "",
    phone: "",
    businessName: "",
    note: "",
};

function getItemUnitPrice(item: CartItem) {
    if (item.isLidOnly) return item.price;
    return item.price + (item.configuration.lidUnitPrice ?? 0);
}

function getItemSubtotal(item: CartItem) {
    return getItemUnitPrice(item) * item.quantity;
}

/** "3.000 ly · 1.000 nắp": cups and lids are counted separately, as in the rows. */
function getQuantitySummary(items: CartItem[]) {
    const totals = new Map<string, number>();
    for (const item of items) {
        const unitLabel = item.isLidOnly ? "nắp" : "ly";
        totals.set(unitLabel, (totals.get(unitLabel) ?? 0) + item.quantity);
    }
    return [...totals]
        .map(([unitLabel, quantity]) => `${quantity.toLocaleString("vi-VN")} ${unitLabel}`)
        .join(" · ");
}

function validateForm(form: OrderForm): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ tên.";
    const phone = form.phone.replace(/[\s.]/g, "");
    if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
    else if (!PHONE_PATTERN.test(phone))
        errors.phone = "Số điện thoại chưa đúng, ví dụ 0912 345 678.";
    return errors;
}

function RequiredMark() {
    return (
        <>
            {" "}
            <span className="req" aria-hidden="true">
                *
            </span>
            <span className="sr-only">(bắt buộc)</span>
        </>
    );
}

export default function CartPage() {
    const items = useCartItems();
    const [form, setForm] = useState<OrderForm>(initialForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const successHeadingRef = useRef<HTMLHeadingElement>(null);

    const totalAmount = useMemo(
        () => (items ?? []).reduce((sum, item) => sum + getItemSubtotal(item), 0),
        [items],
    );

    // The submit button that had focus is gone; land screen readers on the result
    useEffect(() => {
        if (successOrderId !== null) successHeadingRef.current?.focus();
    }, [successOrderId]);

    const handleQuantityChange = (item: CartItem, newQuantity: number) => {
        const key = getCartItemKey(item);
        if (newQuantity < 1000) return;
        updateCartItemQuantity(key, newQuantity);
    };

    const confirmRemove = useCallback(() => {
        if (!removeTarget) return;
        removeCartItem(getCartItemKey(removeTarget));
        setRemoveTarget(null);
    }, [removeTarget]);

    const confirmClear = useCallback(() => {
        clearCart();
        setShowClearConfirm(false);
    }, []);

    const updateField =
        (field: keyof OrderForm) =>
        (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { value } = event.target;
            setForm((current) => ({ ...current, [field]: value }));
            setFieldErrors((current) =>
                current[field] ? { ...current, [field]: undefined } : current,
            );
        };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!items?.length || submitting) return;

        const errors = validateForm(form);
        setFieldErrors(errors);
        if (errors.fullName || errors.phone) {
            (errors.fullName ? nameRef : phoneRef).current?.focus();
            return;
        }

        setSubmitting(true);
        setError("");

        const businessName = form.businessName.trim();
        const note = form.note.trim();

        const allNotes = [businessName ? `Quán: ${businessName}` : "", note]
            .filter(Boolean)
            .join(". ");

        const payload: CreateOrderRequest = {
            customerName: form.fullName.trim(),
            customerPhone: form.phone.trim(),
            customerEmail: null,
            note: allNotes || null,
            items: items.map((item) => ({
                productId: item.isLidOnly
                    ? (item.lidOnlyId ?? item.productId)
                    : item.productId,
                quantity: item.quantity,
                unitPrice: getItemUnitPrice(item),
                lidId: item.isLidOnly
                    ? null
                    : (item.configuration.lidId ?? null),
            })),
        };

        try {
            const result = await createOrder(payload);
            setSuccessOrderId(result.id);
            clearCart();
            setForm(initialForm);
        } catch (err) {
            console.error("[cart] Không gửi được yêu cầu báo giá", err);
            setError(SUBMIT_ERROR);
        } finally {
            setSubmitting(false);
        }
    };

    const copyOrderId = async (orderId: number) => {
        try {
            await navigator.clipboard.writeText(String(orderId));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked (permissions or insecure context): the id stays visible to copy by hand
        }
    };

    if (successOrderId !== null) {
        return (
            <div className="quote-screen">
                <section
                    className="cart-success"
                    aria-labelledby="cart-success-title"
                >
                    <span className="cart-success-icon">
                        <CheckIcon className="h-7 w-7" />
                    </span>
                    <h1
                        id="cart-success-title"
                        ref={successHeadingRef}
                        tabIndex={-1}
                    >
                        Đã gửi yêu cầu báo giá
                    </h1>

                    <div className="cart-success-id">
                        <p>
                            Mã đơn hàng của bạn:{" "}
                            <strong>#{successOrderId}</strong>
                        </p>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => copyOrderId(successOrderId)}
                        >
                            {copied ? (
                                <CheckIcon className="h-5 w-5" />
                            ) : (
                                <CopyIcon className="h-5 w-5" />
                            )}
                            <span aria-live="polite">
                                {copied ? "Đã sao chép" : "Sao chép mã"}
                            </span>
                        </button>
                    </div>

                    <h2 className="cart-section-title">Bước tiếp theo</h2>
                    <ol className="cart-next-steps">
                        {NEXT_STEPS.map((step) => (
                            <li key={step.title}>
                                <strong>{step.title}</strong>
                                <span>{step.text}</span>
                            </li>
                        ))}
                    </ol>

                    <div className="cart-actions">
                        {/* id only: the phone number never goes in a URL */}
                        <Link
                            href={`/track-order?id=${successOrderId}`}
                            className="button-primary"
                        >
                            Theo dõi đơn
                        </Link>
                        {SITE.zaloHref ? (
                            <a
                                href={SITE.zaloHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-secondary"
                            >
                                <ChatIcon className="h-5 w-5" />
                                Nhắn Zalo
                            </a>
                        ) : null}
                        {SITE.phoneHref ? (
                            <a href={SITE.phoneHref} className="button-secondary">
                                <PhoneIcon className="h-5 w-5" />
                                Gọi {SITE.phoneDisplay}
                            </a>
                        ) : null}
                    </div>
                </section>
            </div>
        );
    }

    if (items === null) return <CartLoading />;

    return (
        <div className="quote-screen">
            <MobileTopBar title="Giỏ hàng" />

            {items.length === 0 ? (
                <section className="cart-empty" aria-labelledby="cart-empty-title">
                    <span className="cart-empty-icon">
                        <CartIcon className="h-7 w-7" />
                    </span>
                    <h2 id="cart-empty-title" className="cart-section-title">
                        Giỏ hàng trống
                    </h2>
                    <p>Chọn mẫu ly trong danh mục để gửi yêu cầu báo giá.</p>
                    <div className="cart-actions">
                        <Link href="/products" className="button-primary">
                            Xem sản phẩm
                        </Link>
                        {SITE.zaloHref ? (
                            <a
                                href={SITE.zaloHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-secondary"
                            >
                                <ChatIcon className="h-5 w-5" />
                                Nhắn Zalo
                            </a>
                        ) : null}
                    </div>
                </section>
            ) : (
                <div className="cart-layout">
                    <section
                        className="cart-items"
                        aria-labelledby="cart-items-title"
                    >
                        <div className="cart-list-header">
                            <h2 id="cart-items-title" className="cart-section-title">
                                Sản phẩm ({items.length})
                            </h2>
                            <button
                                type="button"
                                className="cart-clear-btn"
                                onClick={() => setShowClearConfirm(true)}
                            >
                                Xóa tất cả
                            </button>
                        </div>

                        <ul className="cart-items-list">
                            {items.map((item) => {
                                const key = getCartItemKey(item);
                                const unitLabel = item.isLidOnly ? "nắp" : "ly";
                                const href = `/product/${
                                    item.isLidOnly
                                        ? (item.lidOnlyId ?? item.productId)
                                        : item.productId
                                }`;
                                const quantityOptions = [
                                    ...new Set([...QUANTITY_OPTIONS, item.quantity]),
                                ].sort((a, b) => a - b);

                                return (
                                    <li key={key} className="cart-item">
                                        <div className="cart-item-image">
                                            {item.imageSrc ? (
                                                <Image
                                                    src={item.imageSrc}
                                                    alt=""
                                                    width={96}
                                                    height={96}
                                                />
                                            ) : null}
                                        </div>
                                        <div className="cart-item-details">
                                            <div className="cart-item-header">
                                                <h3 className="cart-item-name">
                                                    <Link href={href}>{item.name}</Link>
                                                </h3>
                                                <button
                                                    type="button"
                                                    className="icon-button ghost cart-item-remove"
                                                    aria-label={`Xóa ${item.name}`}
                                                    onClick={() => setRemoveTarget(item)}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <p className="cart-item-config">
                                                {item.isLidOnly
                                                    ? `Nắp ly · ${item.configuration.size}`
                                                    : `${item.configuration.size} · ${item.configuration.printMethod}${
                                                          item.configuration.lidOption &&
                                                          item.configuration.lidOption !== "Không nắp"
                                                              ? ` · ${item.configuration.lidOption}`
                                                              : ""
                                                      }`}
                                            </p>
                                            {SITE.showPrices ? (
                                                <p className="cart-item-unit-price">
                                                    {formatCurrency(getItemUnitPrice(item))} / {unitLabel}
                                                </p>
                                            ) : null}
                                            <div className="cart-item-bottom">
                                                <div className="quantity-dropdown cart-quantity">
                                                    <select
                                                        value={item.quantity}
                                                        aria-label={`Số lượng ${item.name}`}
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                item,
                                                                Number(e.target.value),
                                                            )
                                                        }
                                                    >
                                                        {quantityOptions.map((qty) => (
                                                            <option key={qty} value={qty}>
                                                                {qty.toLocaleString("vi-VN")} {unitLabel}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {SITE.showPrices ? (
                                                    <p className="cart-item-subtotal">
                                                        <span className="sr-only">Thành tiền: </span>
                                                        {formatCurrency(getItemSubtotal(item))}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {SITE.zaloHref ? (
                            <p className="cart-bulk-note">
                                Cần số lượng lớn hơn?{" "}
                                <a
                                    href={SITE.zaloHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Nhắn Zalo
                                </a>
                            </p>
                        ) : null}
                    </section>

                    <form
                        className="quote-form-card cart-summary-card"
                        aria-labelledby="cart-form-title"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div className="cart-total-block">
                            <p className="cart-total">
                                {SITE.showPrices ? (
                                    <>
                                        <span>Tạm tính ({items.length} sản phẩm)</span>
                                        <strong>{formatCurrency(totalAmount)}</strong>
                                    </>
                                ) : (
                                    <>
                                        <span>Số lượng ({items.length} sản phẩm)</span>
                                        <strong>{getQuantitySummary(items)}</strong>
                                    </>
                                )}
                            </p>
                            <p className="cart-total-note">
                                Phí in sẽ được báo trong báo giá.
                            </p>
                        </div>

                        <h2 id="cart-form-title" className="cart-section-title">
                            Thông tin liên hệ
                        </h2>

                        <div>
                            <label>
                                <span>
                                    Họ tên
                                    <RequiredMark />
                                </span>
                                <input
                                    ref={nameRef}
                                    name="name"
                                    autoComplete="name"
                                    value={form.fullName}
                                    onChange={updateField("fullName")}
                                    placeholder="Nhập họ tên"
                                    aria-invalid={fieldErrors.fullName ? true : undefined}
                                    aria-describedby={
                                        fieldErrors.fullName ? "cart-name-error" : undefined
                                    }
                                />
                            </label>
                            {fieldErrors.fullName ? (
                                <p id="cart-name-error" className="field-error">
                                    {fieldErrors.fullName}
                                </p>
                            ) : null}
                        </div>
                        <div>
                            <label>
                                <span>
                                    Số điện thoại
                                    <RequiredMark />
                                </span>
                                <input
                                    ref={phoneRef}
                                    type="tel"
                                    name="tel"
                                    autoComplete="tel"
                                    value={form.phone}
                                    onChange={updateField("phone")}
                                    placeholder="Ví dụ 0912 345 678"
                                    aria-invalid={fieldErrors.phone ? true : undefined}
                                    aria-describedby={
                                        fieldErrors.phone ? "cart-phone-error" : undefined
                                    }
                                />
                            </label>
                            {fieldErrors.phone ? (
                                <p id="cart-phone-error" className="field-error">
                                    {fieldErrors.phone}
                                </p>
                            ) : null}
                        </div>
                        <label>
                            <span>Tên quán / doanh nghiệp</span>
                            <input
                                name="organization"
                                autoComplete="organization"
                                value={form.businessName}
                                onChange={updateField("businessName")}
                                placeholder="Nhập tên quán (nếu có)"
                            />
                        </label>
                        <label>
                            <span>Ghi chú</span>
                            <textarea
                                name="note"
                                value={form.note}
                                onChange={updateField("note")}
                                placeholder="Ghi chú thêm về đơn hàng..."
                                rows={3}
                            />
                        </label>

                        {error ? (
                            <p role="alert" className="cart-error">
                                {error}
                                {SITE.zaloHref ? (
                                    <>
                                        {" "}
                                        <a
                                            href={SITE.zaloHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Nhắn Zalo
                                        </a>
                                    </>
                                ) : null}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="button-primary w-full"
                        >
                            {submitting ? (
                                <>
                                    <InlineSpinner className="h-4 w-4" />
                                    Đang gửi...
                                </>
                            ) : SITE.showPrices ? (
                                `Gửi yêu cầu báo giá · ${formatCurrency(totalAmount)}`
                            ) : (
                                "Gửi yêu cầu báo giá"
                            )}
                        </button>
                    </form>
                </div>
            )}

            <ConfirmModal
                open={removeTarget !== null}
                title="Xóa sản phẩm?"
                description={`Bạn muốn xóa "${removeTarget?.name ?? ""}" khỏi giỏ hàng?`}
                danger
                confirmLabel="Xóa"
                onConfirm={confirmRemove}
                onCancel={() => setRemoveTarget(null)}
            />
            <ConfirmModal
                open={showClearConfirm}
                title="Xóa toàn bộ giỏ hàng?"
                description="Tất cả sản phẩm trong giỏ hàng sẽ bị xóa."
                danger
                confirmLabel="Xóa tất cả"
                onConfirm={confirmClear}
                onCancel={() => setShowClearConfirm(false)}
            />
            <LoadingOverlay open={submitting} message="Đang gửi yêu cầu báo giá..." />
        </div>
    );
}
