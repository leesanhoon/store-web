"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { addToCart, CartConfiguration, CartUnit, defaultCartConfiguration } from "@/lib/cart";

const quantityOptions = [1000, 2000, 3000, 4000, 5000];
const cupModelOptions = ["PET", "PP", "Ly giấy", "Ly in logo"];
const sizeOptions = ["360ml", "500ml", "700ml"];
const materialOptions = ["PET", "PP", "Giấy kraft", "Giấy trắng"];
const printMethodOptions = ["Không in", "In 1 màu", "In 2 màu", "In full màu"];

type CartProduct = {
    productId: number;
    name: string;
    price: number;
    categoryName: string;
    unit?: CartUnit;
    defaultQuantity?: number;
};

type OpenPayload = CartProduct & {
    anchorRect?: DOMRect | null;
};

type FlyToken = {
    id: number;
    name: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
};

type CartConfiguratorContextValue = {
    openConfigurator: (payload: OpenPayload) => void;
};

const CartConfiguratorContext = createContext<CartConfiguratorContextValue | null>(null);

export function useCartConfigurator() {
    const value = useContext(CartConfiguratorContext);
    if (!value) {
        throw new Error("useCartConfigurator must be used within CartConfiguratorProvider");
    }

    return value;
}

function OptionGroup<T extends string | number>({
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
        <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-header">{label}</legend>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const active = option === value;

                    return (
                        <button
                            key={String(option)}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15 ${
                                active ? "border-slate-900 bg-slate-900 text-white" : "border-[#dbcfc0] bg-white text-slate-700 hover:border-slate-900"
                            }`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

export default function CartConfiguratorProvider({ children }: { children: ReactNode }) {
    const [activeProduct, setActiveProduct] = useState<OpenPayload | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState(1000);
    const [configuration, setConfiguration] = useState<CartConfiguration>(defaultCartConfiguration);
    const [flyToken, setFlyToken] = useState<FlyToken | null>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);

    const resetState = (product: OpenPayload) => {
        setSelectedQuantity(quantityOptions.includes(product.defaultQuantity ?? 1000) ? product.defaultQuantity ?? 1000 : 1000);
        setConfiguration(defaultCartConfiguration);
    };

    const openConfigurator = (payload: OpenPayload) => {
        setActiveProduct(payload);
        resetState(payload);
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const updateConfiguration = (key: keyof CartConfiguration, value: string) => {
        setConfiguration((current) => ({ ...current, [key]: value }));
    };

    const startFlyAnimation = (sourceRect?: DOMRect | null) => {
        if (typeof window === "undefined") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const target = document.getElementById("header-cart-link");
        const source = sourceRect ?? confirmRef.current?.getBoundingClientRect();
        if (!source || !target) return;

        const targetRect = target.getBoundingClientRect();
        const token: FlyToken = {
            id: Date.now(),
            name: activeProduct?.name ?? "Sản phẩm",
            fromX: source.left + source.width / 2,
            fromY: source.top + source.height / 2,
            toX: targetRect.left + targetRect.width / 2,
            toY: targetRect.top + targetRect.height / 2,
        };

        setFlyToken(token);
        window.setTimeout(() => setFlyToken(null), 720);
    };

    const handleConfirm = () => {
        if (!activeProduct) return;

        addToCart({
            productId: activeProduct.productId,
            name: activeProduct.name,
            price: activeProduct.price,
            quantity: selectedQuantity,
            unit: activeProduct.unit ?? "cay",
            categoryName: activeProduct.categoryName,
            configuration,
        });
        startFlyAnimation(activeProduct.anchorRect);
        setIsOpen(false);
    };

    return (
        <CartConfiguratorContext.Provider value={{ openConfigurator }}>
            {children}

            {isOpen && activeProduct ? (
                <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="presentation">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`cart-configurator-${activeProduct.productId}`}
                        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{activeProduct.categoryName}</p>
                                <h2 id={`cart-configurator-${activeProduct.productId}`} className="mt-2 text-2xl font-semibold text-header">
                                    {activeProduct.name}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-full border border-[#dbcfc0] px-3 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/15"
                                aria-label="Đóng popup chọn sản phẩm"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="mt-6 grid gap-5">
                            <OptionGroup label="Số lượng" options={quantityOptions} value={selectedQuantity} onChange={setSelectedQuantity} />
                            <OptionGroup
                                label="Mẫu ly"
                                options={cupModelOptions}
                                value={configuration.cupModel}
                                onChange={(value) => updateConfiguration("cupModel", value)}
                            />
                            <OptionGroup
                                label="Kích thước"
                                options={sizeOptions}
                                value={configuration.size}
                                onChange={(value) => updateConfiguration("size", value)}
                            />
                            <OptionGroup
                                label="Chất liệu"
                                options={materialOptions}
                                value={configuration.material}
                                onChange={(value) => updateConfiguration("material", value)}
                            />
                            <OptionGroup
                                label="Cách in"
                                options={printMethodOptions}
                                value={configuration.printMethod}
                                onChange={(value) => updateConfiguration("printMethod", value)}
                            />
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
                    style={
                        {
                            "--from-x": `${flyToken.fromX}px`,
                            "--from-y": `${flyToken.fromY}px`,
                            "--to-x": `${flyToken.toX}px`,
                            "--to-y": `${flyToken.toY}px`,
                            animation: "fly-to-cart 700ms cubic-bezier(.22,1,.36,1) forwards",
                        } as CSSProperties
                    }
                >
                    {flyToken.name}
                </div>
            ) : null}
        </CartConfiguratorContext.Provider>
    );
}
