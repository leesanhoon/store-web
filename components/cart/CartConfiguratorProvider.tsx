"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/mobile-store/icons";
import { addToCart, CartConfiguration, CartUnit, defaultCartConfiguration } from "@/lib/cart";
import { formatCurrency } from "@/lib/products/display";

const printMethodOptions = ["Không in", "In 1 màu", "In nhiều màu"];
const lidOptions = ["Không nắp", "Nắp bằng", "Nắp cầu"];

type CartProduct = {
  productId: number;
  name: string;
  price: number;
  categoryName: string;
  unit?: CartUnit;
  defaultQuantity?: number;
  imageSrc?: string | null;
};
type OpenPayload = CartProduct & { anchorRect?: DOMRect | null };
type FlyToken = { id: number; name: string; fromX: number; fromY: number; toX: number; toY: number };

type CartConfiguratorContextValue = { openConfigurator: (product: OpenPayload) => void };
const CartConfiguratorContext = createContext<CartConfiguratorContextValue | null>(null);

export function useCartConfigurator() {
  const context = useContext(CartConfiguratorContext);
  if (!context) throw new Error("useCartConfigurator must be used within CartConfiguratorProvider");
  return context;
}

type ConfigState = CartConfiguration & { quantity: number };
const initialConfiguration: ConfigState = { ...defaultCartConfiguration, quantity: 1000 };

function inferCupModel(product?: OpenPayload | null) {
  const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
  if (text.includes("pp")) return "PP";
  if (text.includes("giấy") || text.includes("giay")) return "Ly giấy";
  return "PET";
}

function inferMaterial(product?: OpenPayload | null) {
  const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
  if (text.includes("pp")) return "PP";
  if (text.includes("giấy") || text.includes("giay")) return "Giấy";
  return "PET";
}

function inferSize(product?: OpenPayload | null) {
  const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`;
  return text.match(/(12|16|20)\s?oz|(360|500|700)\s?ml/i)?.[0].replace(/\s+/g, "") ?? "500ml";
}

export default function CartConfiguratorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<OpenPayload | null>(null);
  const [configuration, setConfiguration] = useState<ConfigState>(initialConfiguration);
  const [flyToken, setFlyToken] = useState<FlyToken | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const openConfigurator = (product: OpenPayload) => {
    setActiveProduct(product);
    setConfiguration({
      cupModel: inferCupModel(product),
      size: inferSize(product),
      material: inferMaterial(product),
      printMethod: "Không in",
      lidOption: "Không nắp",
      note: "",
      quantity: product.defaultQuantity ?? 1000,
    });
    setIsOpen(true);
  };

  const updateConfiguration = <Key extends keyof CartConfiguration>(
    key: Key,
    value: CartConfiguration[Key],
  ) => setConfiguration((current) => ({ ...current, [key]: value }));

  const setQuantity = (value: number) =>
    setConfiguration((current) => ({ ...current, quantity: Math.max(100, value) }));

  const handleConfirm = () => {
    if (!activeProduct) return;

    addToCart({
      productId: activeProduct.productId,
      name: activeProduct.name,
      price: activeProduct.price,
      categoryName: activeProduct.categoryName,
      unit: activeProduct.unit ?? "cay",
      quantity: configuration.quantity,
      imageSrc: activeProduct.imageSrc,
      configuration,
    });

    const rect = confirmRef.current?.getBoundingClientRect();
    if (activeProduct.anchorRect && rect) {
      setFlyToken({
        id: Date.now(),
        name: activeProduct.name,
        fromX: activeProduct.anchorRect.left + activeProduct.anchorRect.width / 2,
        fromY: activeProduct.anchorRect.top + activeProduct.anchorRect.height / 2,
        toX: rect.left + rect.width / 2,
        toY: rect.top + rect.height / 2,
      });
    }

    setIsOpen(false);
  };

  useEffect(() => {
    if (!flyToken) return;
    const timeout = window.setTimeout(() => setFlyToken(null), 750);
    return () => window.clearTimeout(timeout);
  }, [flyToken]);

  return (
    <CartConfiguratorContext.Provider value={{ openConfigurator }}>
      {children}
      {isOpen && activeProduct ? (
        <div className="cart-configurator-overlay" role="dialog" aria-modal="true" aria-label="Cấu hình sản phẩm">
          <button
            type="button"
            className="cart-configurator-backdrop"
            aria-label="Đóng cấu hình"
            onClick={() => setIsOpen(false)}
          />
          <section className="product-config-sheet">
            <div className="sheet-handle" />
            <div className="sheet-product-summary">
              <div className="sheet-product-image">
                {activeProduct.imageSrc ? (
                  <Image src={activeProduct.imageSrc} alt={activeProduct.name} width={220} height={220} />
                ) : null}
              </div>
              <div>
                <h2>{activeProduct.name}</h2>
                <p className="sheet-price">Từ {formatCurrency(activeProduct.price)}</p>
                <p className="sheet-moq">MOQ 1.000</p>
              </div>
            </div>

            <div className="sheet-control-group">
              <h3>Số lượng</h3>
              <div className="quantity-stepper">
                <button type="button" onClick={() => setQuantity(configuration.quantity - 100)} aria-label="Giảm số lượng">
                  <MinusIcon className="h-5 w-5" />
                </button>
                <strong>{configuration.quantity.toLocaleString("vi-VN")}</strong>
                <button type="button" onClick={() => setQuantity(configuration.quantity + 100)} aria-label="Tăng số lượng">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <OptionGroup
              label="Loại in"
              options={printMethodOptions}
              value={configuration.printMethod}
              onChange={(value) => updateConfiguration("printMethod", value)}
            />
            <OptionGroup
              label="Nắp đi kèm"
              options={lidOptions}
              value={configuration.lidOption ?? "Không nắp"}
              onChange={(value) => updateConfiguration("lidOption", value)}
            />

            <label className="sheet-note">
              <span>Ghi chú</span>
              <textarea
                rows={3}
                value={configuration.note ?? ""}
                onChange={(event) => updateConfiguration("note", event.target.value)}
                placeholder="Ghi chú thêm..."
              />
            </label>

            <button ref={confirmRef} type="button" onClick={handleConfirm} className="sheet-submit">
              Thêm vào yêu cầu
            </button>
          </section>
        </div>
      ) : null}
      {flyToken ? (
        <div
          key={flyToken.id}
          className="pointer-events-none fixed z-[90] rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl"
          style={{
            "--from-x": `${flyToken.fromX}px`,
            "--from-y": `${flyToken.fromY}px`,
            "--to-x": `${flyToken.toX}px`,
            "--to-y": `${flyToken.toY}px`,
            animation: "fly-to-cart 700ms cubic-bezier(.22,1,.36,1) forwards",
          } as CSSProperties}
        >
          {flyToken.name}
        </div>
      ) : null}
    </CartConfiguratorContext.Provider>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="sheet-control-group">
      <h3>{label}</h3>
      <div className="sheet-segmented-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={value === option ? "active" : undefined}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
