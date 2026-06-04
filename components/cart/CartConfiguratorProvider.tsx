"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { addToCart, CartConfiguration, CartUnit, defaultCartConfiguration } from "@/lib/cart";

const quantityOptions = [1000, 2000, 3000, 4000, 5000];
const cupModelOptions = ["PET", "PP", "Ly giấy", "Ly in logo"];
const sizeOptions = ["360ml", "500ml", "700ml"];
const materialOptions = ["PET", "PP", "Giấy kraft", "Giấy trắng"];
const printMethodOptions = ["Không in", "In 1 màu", "In 2 màu", "In full màu"];

type CartProduct = { productId: number; name: string; price: number; categoryName: string; unit?: CartUnit; defaultQuantity?: number };
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

export default function CartConfiguratorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<OpenPayload | null>(null);
  const [configuration, setConfiguration] = useState<ConfigState>(initialConfiguration);
  const [flyToken, setFlyToken] = useState<FlyToken | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const openConfigurator = (product: OpenPayload) => {
    setActiveProduct(product);
    setConfiguration({ ...defaultCartConfiguration, quantity: product.defaultQuantity ?? 1000 });
    setIsOpen(true);
  };

  const updateConfiguration = <Key extends keyof CartConfiguration>(key: Key, value: CartConfiguration[Key]) =>
    setConfiguration((current) => ({ ...current, [key]: value }));

  const setQuantity = (value: number) => setConfiguration((current) => ({ ...current, quantity: value }));

  const handleConfirm = () => {
    if (!activeProduct) return;

    addToCart({
      productId: activeProduct.productId,
      name: activeProduct.name,
      price: activeProduct.price,
      categoryName: activeProduct.categoryName,
      unit: activeProduct.unit ?? "cay",
      quantity: configuration.quantity,
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
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 px-4 py-6 sm:items-center">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-[#dbe5ef] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cấu hình nhanh</p>
                <h2 className="mt-2 text-2xl font-semibold text-header">{activeProduct.name}</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-[#dbe5ef] px-3 py-2 text-sm font-semibold text-slate-700">
                Đóng
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <OptionGroup label="Số lượng" options={quantityOptions} value={configuration.quantity} onChange={setQuantity} />
              <OptionGroup label="Mẫu ly" options={cupModelOptions} value={configuration.cupModel} onChange={(value) => updateConfiguration("cupModel", value)} />
              <OptionGroup label="Kích thước" options={sizeOptions} value={configuration.size} onChange={(value) => updateConfiguration("size", value)} />
              <OptionGroup label="Chất liệu" options={materialOptions} value={configuration.material} onChange={(value) => updateConfiguration("material", value)} />
              <OptionGroup label="Cách in" options={printMethodOptions} value={configuration.printMethod} onChange={(value) => updateConfiguration("printMethod", value)} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setIsOpen(false)} className="button-secondary flex-1">
                Hủy
              </button>
              <button ref={confirmRef} type="button" onClick={handleConfirm} className="button-primary flex-1">
                Thêm vào giỏ
              </button>
            </div>
          </div>
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

function OptionGroup<T extends string | number>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (value: T) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-header">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${value === option ? "border-slate-900 bg-slate-900 text-white" : "border-[#dbe5ef] bg-white text-slate-700 hover:border-slate-400"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
