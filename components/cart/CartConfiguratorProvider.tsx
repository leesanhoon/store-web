"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PriceTierDto, ProductDto, ProductVariantDto } from "@/lib/api/products";
import {
  addToCart,
  CartConfiguration,
  CartUnit,
  defaultCartConfiguration,
} from "@/lib/cart";
import { formatCurrency, getVariantLabel } from "@/lib/products/display";

const printMethodOptions = ["Không in", "In 1 màu", "In nhiều màu"];

type CartProduct = {
  productId: number;
  name: string;
  price: number;
  categoryName: string;
  variants?: ProductVariantDto[];
  compatibleLids?: ProductDto[];
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

function getFirstPriceTier(variant?: ProductVariantDto | null) {
  return variant?.priceTiers?.[0] ?? null;
}

function getPriceTierForQuantity(variant: ProductVariantDto | null, quantity: number) {
  if (!variant?.priceTiers?.length) return null;

  return variant.priceTiers.reduce<PriceTierDto | null>((selected, tier) => {
    if (quantity < tier.minQuantity) return selected;
    if (!selected || tier.minQuantity > selected.minQuantity) return tier;
    return selected;
  }, null) ?? getFirstPriceTier(variant);
}

function inferCupModel(product?: OpenPayload | null) {
  const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
  if (text.includes("pp")) return "PP";
  if (text.includes("giay") || text.includes("giấy")) return "Ly giay";
  return "PET";
}

function inferMaterial(product?: OpenPayload | null) {
  const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
  if (text.includes("pp")) return "PP";
  if (text.includes("giay") || text.includes("giấy")) return "Giay";
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
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedTierMinQuantity, setSelectedTierMinQuantity] = useState<number | null>(null);
  const [selectedLidId, setSelectedLidId] = useState<number | null>(null);
  const [selectedLidPriceId, setSelectedLidPriceId] = useState<number | null>(null);
  const [flyToken, setFlyToken] = useState<FlyToken | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const flyTokenIdRef = useRef(0);

  const selectedVariant =
    activeProduct?.variants?.find((variant) => variant.id === selectedVariantId) ??
    activeProduct?.variants?.[0] ??
    null;
  const selectedTier =
    selectedVariant?.priceTiers.find((tier) => tier.minQuantity === selectedTierMinQuantity) ??
    getPriceTierForQuantity(selectedVariant, configuration.quantity);
  const activeUnitPrice = selectedTier?.unitPrice ?? activeProduct?.price ?? 0;

  const selectedLid = activeProduct?.compatibleLids?.find((lid) => lid.id === selectedLidId) ?? null;
  const selectedLidVariant = selectedLid?.variants.find((v) => v.id === selectedLidPriceId) ?? null;
  const lidUnitPrice = selectedLidVariant?.priceTiers[0]?.unitPrice ?? 0;
  const totalUnitPrice = activeUnitPrice + lidUnitPrice;

  const getMatchingLidVariants = (lid: ProductDto) => {
    if (!selectedVariant) return lid.variants;
    return lid.variants.filter((v) => v.diameterMm === selectedVariant.diameterMm);
  };

  const openConfigurator = (product: OpenPayload) => {
    const firstVariant = product.variants?.[0] ?? null;
    const firstTier = getFirstPriceTier(firstVariant);
    const rawQty = product.defaultQuantity ?? firstTier?.minQuantity ?? 1000;
    const quantity = Math.min(10000, Math.max(1000, Math.ceil(rawQty / 1000) * 1000));

    setActiveProduct(product);
    setSelectedVariantId(firstVariant?.id ?? null);
    setSelectedTierMinQuantity(firstTier?.minQuantity ?? null);
    setSelectedLidId(null);
    setSelectedLidPriceId(null);
    setConfiguration({
      cupModel: firstVariant ? `${firstVariant.capacityMl}ml - ${firstVariant.diameterMm}mm` : inferCupModel(product),
      size: firstVariant ? `${firstVariant.capacityMl}ml` : inferSize(product),
      material: inferMaterial(product),
      printMethod: "Không in",
      lidOption: "Không nắp",
      note: "",
      quantity,
    });
    setIsOpen(true);
  };

  const updateConfiguration = <Key extends keyof CartConfiguration>(
    key: Key,
    value: CartConfiguration[Key],
  ) => setConfiguration((current) => ({ ...current, [key]: value }));

  const selectVariant = (variant: ProductVariantDto) => {
    const firstTier = getFirstPriceTier(variant);

    setSelectedVariantId(variant.id);
    setSelectedTierMinQuantity(firstTier?.minQuantity ?? null);
    setSelectedLidPriceId(null);
    setConfiguration((current) => ({
      ...current,
      cupModel: `${variant.capacityMl}ml - ${variant.diameterMm}mm`,
      size: `${variant.capacityMl}ml`,
      quantity: Math.min(10000, Math.max(current.quantity, Math.ceil((firstTier?.minQuantity ?? current.quantity) / 1000) * 1000)),
      lidPriceId: undefined,
      lidDiameterMm: undefined,
      lidUnitPrice: undefined,
    }));
  };

  const selectPriceTier = (tier: PriceTierDto) => {
    setSelectedTierMinQuantity(tier.minQuantity);
    setConfiguration((current) => ({
      ...current,
      quantity: Math.min(10000, Math.ceil(tier.minQuantity / 1000) * 1000),
    }));
  };

  const selectLid = (lid: ProductDto | null) => {
    if (!lid) {
      setSelectedLidId(null);
      setSelectedLidPriceId(null);
      setConfiguration((current) => ({
        ...current,
        lidOption: "Không nắp",
        lidId: undefined,
        lidName: undefined,
        lidPriceId: undefined,
        lidDiameterMm: undefined,
        lidUnitPrice: undefined,
      }));
      return;
    }
    setSelectedLidId(lid.id);
    const matching = getMatchingLidVariants(lid);
    const firstVariant = matching[0] ?? null;
    setSelectedLidPriceId(firstVariant?.id ?? null);
    setConfiguration((current) => ({
      ...current,
      lidOption: lid.name,
      lidId: lid.id,
      lidName: lid.name,
      lidPriceId: firstVariant?.id,
      lidDiameterMm: firstVariant?.diameterMm,
      lidUnitPrice: firstVariant?.priceTiers[0]?.unitPrice,
    }));
  };

  const selectLidVariant = (variant: ProductVariantDto) => {
    setSelectedLidPriceId(variant.id);
    setConfiguration((current) => ({
      ...current,
      lidPriceId: variant.id,
      lidDiameterMm: variant.diameterMm,
      lidUnitPrice: variant.priceTiers[0]?.unitPrice,
    }));
  };

  const handleConfirm = () => {
    if (!activeProduct) return;

    const cupConfiguration: CartConfiguration = {
      ...configuration,
      lidUnitPrice: undefined,
    };

    addToCart({
      productId: activeProduct.productId,
      name: activeProduct.name,
      price: activeUnitPrice,
      categoryName: activeProduct.categoryName,
      unit: activeProduct.unit ?? "cay",
      quantity: configuration.quantity,
      imageSrc: activeProduct.imageSrc,
      configuration: cupConfiguration,
      variantId: selectedVariant?.id,
      capacityMl: selectedVariant?.capacityMl,
      diameterMm: selectedVariant?.diameterMm,
      priceTierMinQuantity: selectedTier?.minQuantity,
    });

    if (selectedLid && selectedLidVariant) {
      const lidPrice = selectedLidVariant.priceTiers[0]?.unitPrice ?? 0;
      addToCart({
        productId: selectedLid.id,
        name: selectedLid.name,
        price: lidPrice,
        categoryName: activeProduct.categoryName,
        unit: "thung",
        quantity: configuration.quantity,
        imageSrc: selectedLid.avatarImageUrl,
        isLidOnly: true,
        lidOnlyId: selectedLid.id,
        lidOnlyPriceId: selectedLidVariant.id,
        lidOnlyDiameterMm: selectedLidVariant.diameterMm,
        configuration: {
          ...defaultCartConfiguration,
          cupModel: `Nắp ⌀${selectedLidVariant.diameterMm}mm`,
          size: `⌀${selectedLidVariant.diameterMm}mm`,
          material: "Nắp ly",
          printMethod: "Không in",
          lidOption: selectedLid.name,
          lidId: selectedLid.id,
          lidName: selectedLid.name,
          lidPriceId: selectedLidVariant.id,
          lidDiameterMm: selectedLidVariant.diameterMm,
          lidUnitPrice: 0,
        },
      });
    }

    const rect = confirmRef.current?.getBoundingClientRect();
    if (activeProduct.anchorRect && rect) {
      flyTokenIdRef.current += 1;
      setFlyToken({
        id: flyTokenIdRef.current,
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
                <p className="sheet-price">{formatCurrency(totalUnitPrice)} / ly</p>
                <p className="sheet-moq">
                  Đặt tối thiểu {new Intl.NumberFormat("vi-VN").format(selectedTier?.minQuantity ?? 1000)} ly
                </p>
              </div>
            </div>

            <div className="sheet-specs-row">
              <span>{inferSize(activeProduct)}</span>
              <span>{inferMaterial(activeProduct)}</span>
            </div>

            {activeProduct.variants?.length ? (
              <div className="sheet-control-group">
                <h3>Biến thể</h3>
                <div className="sheet-variant-options">
                  {activeProduct.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant)}
                      className={selectedVariant?.id === variant.id ? "active" : undefined}
                    >
                      <strong>{getVariantLabel(variant)}</strong>
                      <span>Từ {formatCurrency(getFirstPriceTier(variant)?.unitPrice ?? activeProduct.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedVariant?.priceTiers?.length ? (
              <div className="sheet-control-group">
                <h3>Bậc giá</h3>
                <div className="sheet-tier-options">
                  {selectedVariant.priceTiers.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => selectPriceTier(tier)}
                      className={selectedTier?.id === tier.id ? "active" : undefined}
                    >
                      <span>Từ {new Intl.NumberFormat("vi-VN").format(tier.minQuantity)} ly</span>
                      <strong>{formatCurrency(tier.unitPrice)}</strong>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <OptionGroup
              label="Loại in"
              options={printMethodOptions}
              value={configuration.printMethod}
              onChange={(value) => updateConfiguration("printMethod", value)}
            />

            <div className="sheet-control-group">
              <h3>Nắp đi kèm</h3>
              <div className="sheet-segmented-options sheet-lid-options">
                <button
                  type="button"
                  onClick={() => selectLid(null)}
                  className={!selectedLidId ? "active" : undefined}
                >
                  Không nắp
                </button>
                {(activeProduct.compatibleLids ?? []).map((lid) => (
                  <button
                    key={lid.id}
                    type="button"
                    onClick={() => selectLid(lid)}
                    className={selectedLidId === lid.id ? "active" : undefined}
                  >
                    {lid.name}
                  </button>
                ))}
              </div>
              {selectedLid && getMatchingLidVariants(selectedLid).length > 0 ? (
                <div className="sheet-tier-options">
                  {getMatchingLidVariants(selectedLid).map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectLidVariant(variant)}
                      className={selectedLidPriceId === variant.id ? "active" : undefined}
                    >
                      <span>{variant.sizeName || `${variant.diameterMm}mm`}</span>
                      <strong>{formatCurrency(variant.priceTiers[0]?.unitPrice ?? 0)}</strong>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {lidUnitPrice > 0 ? (
              <div className="sheet-price-breakdown">
                <div><span>Ly</span><span>{formatCurrency(activeUnitPrice)}</span></div>
                <div><span>+ Nắp ({selectedLid?.name})</span><span>{formatCurrency(lidUnitPrice)}</span></div>
                <div className="total"><span>Tổng/ly</span><strong>{formatCurrency(totalUnitPrice)}</strong></div>
              </div>
            ) : null}

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
              Thêm vào giỏ hàng - {formatCurrency(totalUnitPrice * configuration.quantity)}
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
