"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import { BackIcon, CloudIcon, DocumentIcon, UploadIcon } from "@/components/mobile-store/icons";
import QuoteActionButton from "@/components/QuoteActionButton";
import {
  clearCart,
  formatUnit,
  getCartItemKey,
  getCartItems,
  removeCartItem,
  type CartItem,
} from "@/lib/cart";

type QuoteForm = {
  businessName: string;
  productInterest: string;
  quantity: string;
  note: string;
  logoFileName: string;
};

const initialForm: QuoteForm = {
  businessName: "",
  productInterest: "",
  quantity: "",
  note: "",
  logoFileName: "",
};

const reasons = [
  "In 1 màu / nhiều màu sắc nét",
  "Hỗ trợ thiết kế miễn phí",
  "Báo giá nhanh trong 24h",
  "Giao hàng toàn quốc",
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => getCartItems());
  const [form, setForm] = useState<QuoteForm>(() => ({
    ...initialForm,
    productInterest: getCartItems()[0]?.name ?? "",
    quantity: getCartItems()[0]?.quantity ? String(getCartItems()[0].quantity) : "",
  }));
  const [message, setMessage] = useState("");

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const selectedProduct = form.productInterest || items[0]?.name || "Sản phẩm cần báo giá";
  const quoteNote = [
    `Sản phẩm quan tâm: ${selectedProduct}`,
    `Số lượng dự kiến: ${form.quantity || totalQuantity || "Chưa nhập"}`,
    form.logoFileName ? `Logo đã chọn: ${form.logoFileName}` : "Logo: sẽ gửi sau",
    form.note ? `Ghi chú: ${form.note}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const reloadCart = () => setItems(getCartItems());

  const handleRemoveItem = (item: CartItem) => {
    removeCartItem(getCartItemKey(item));
    reloadCart();
  };

  const handleClear = () => {
    clearCart();
    reloadCart();
    setForm(initialForm);
  };

  const canSubmit = items.length > 0 && form.businessName.trim().length > 0;

  return (
    <MobileAppShell>
      <div className="quote-screen">
        <header className="mobile-topbar">
          <Link href="/products" className="icon-button" aria-label="Quay lại danh mục">
            <BackIcon className="h-6 w-6" />
          </Link>
          <h1>Yêu cầu đặt hàng</h1>
          <span className="icon-button ghost" aria-hidden="true" />
        </header>

        <section className="quote-stepper" aria-label="Quy trình đặt hàng">
          {[
            { label: "Chọn sản phẩm", icon: DocumentIcon },
            { label: "Gửi logo", icon: CloudIcon },
            { label: "Nhận báo giá", icon: DocumentIcon },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className={index === 0 ? "active" : undefined}>
                <span className="step-number">{index + 1}</span>
                <span className="step-icon">
                  <Icon className="h-6 w-6" />
                </span>
                <strong>{step.label}</strong>
              </div>
            );
          })}
        </section>

        <section className="quote-form-card">
          <label>
            <span>Tên quán *</span>
            <input
              value={form.businessName}
              onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
              placeholder="Nhập tên quán của bạn"
            />
          </label>

          <label>
            <span>Sản phẩm quan tâm *</span>
            <select
              value={form.productInterest}
              onChange={(event) => setForm((current) => ({ ...current, productInterest: event.target.value }))}
            >
              <option value="">Chọn sản phẩm</option>
              {items.map((item) => (
                <option key={getCartItemKey(item)} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Số lượng dự kiến *</span>
            <div className="quantity-field">
              <input
                inputMode="numeric"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                placeholder="Nhập số lượng"
              />
              <em>đơn vị</em>
            </div>
          </label>

          <div>
            <span className="field-label">Gửi logo / ghi chú</span>
            <div className="upload-note-grid">
              <label className="upload-box">
                <UploadIcon className="h-8 w-8" />
                <strong>{form.logoFileName || "Tải logo tại đây"}</strong>
                <span>(JPG, PNG, AI, PDF...)</span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      logoFileName: event.target.files?.[0]?.name ?? "",
                    }))
                  }
                />
              </label>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Ghi chú thêm về kích thước, màu in, vị trí in..."
                rows={5}
              />
            </div>
          </div>

          {items.length > 0 ? (
            <div className="quote-items">
              {items.map((item) => (
                <article key={getCartItemKey(item)}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity.toLocaleString("vi-VN")} {formatUnit(item.unit)} · {item.configuration.printMethod}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item)}>
                    Xóa
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="why-card">
          <div>
            <h2>Vì sao chọn Cup Store?</h2>
            <ul>
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <Image
            src="/images/mockups/logo-cup-500-urban.png"
            alt="Ly giấy in logo"
            width={320}
            height={360}
          />
        </section>

        <div className="quote-actions">
          {canSubmit ? (
            <QuoteActionButton
              fullName={form.businessName}
              phone=""
              businessName={form.businessName}
              note={quoteNote}
              items={items}
              onCreated={() => {
                setMessage("Đã lưu yêu cầu báo giá và mở Gmail để gửi thông tin.");
                setForm(initialForm);
              }}
            >
              Gửi yêu cầu
            </QuoteActionButton>
          ) : (
            <Link href={items.length === 0 ? "/products" : "#"} className="button-primary w-full">
              Gửi yêu cầu
            </Link>
          )}
          {items.length > 0 ? (
            <button type="button" onClick={handleClear} className="button-secondary w-full">
              Xóa giỏ
            </button>
          ) : null}
          {message ? <p>{message}</p> : null}
        </div>
      </div>
    </MobileAppShell>
  );
}
