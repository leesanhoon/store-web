"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { CheckIcon, CloseIcon } from "@/components/mobile-store/icons";
import type {
    PriceTierDto,
    ProductDto,
    ProductVariantDto,
} from "@/lib/api/products";
import {
    addToCart,
    CartConfiguration,
    CartUnit,
    defaultCartConfiguration,
} from "@/lib/cart";
import {
    formatCurrency,
    getMinMoq,
    getVariantLabel,
} from "@/lib/products/display";
import { PRICE_HIDDEN_LABEL, SITE } from "@/lib/site";

export const QUANTITY_OPTIONS = [1000, 3000, 5000, 10000, 20000] as const;
const printMethodOptions = ["Không in", "In 1 màu", "In nhiều màu"];
const TOAST_MS = 4000;

const formatQuantity = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value);

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

type CartConfiguratorContextValue = {
    openConfigurator: (product: CartProduct) => void;
    /** Shows the "added to cart" toast (also used by add flows outside the dialog). */
    notifyAdded: (name: string) => void;
};
const CartConfiguratorContext =
    createContext<CartConfiguratorContextValue | null>(null);

export function useCartConfigurator() {
    const context = useContext(CartConfiguratorContext);
    if (!context)
        throw new Error(
            "useCartConfigurator must be used within CartConfiguratorProvider",
        );
    return context;
}

type ConfigState = CartConfiguration & { quantity: number };
const initialConfiguration: ConfigState = {
    ...defaultCartConfiguration,
    quantity: 1000,
};

const getLidVariantLabel = (variant: ProductVariantDto) =>
    variant.sizeName || `${variant.diameterMm}mm`;

function getFirstPriceTier(variant?: ProductVariantDto | null) {
    return variant?.priceTiers?.[0] ?? null;
}

function getPriceTierForQuantity(
    variant: ProductVariantDto | null,
    quantity: number,
) {
    if (!variant?.priceTiers?.length) return null;

    return (
        variant.priceTiers.reduce<PriceTierDto | null>((selected, tier) => {
            if (quantity < tier.minQuantity) return selected;
            if (!selected || tier.minQuantity > selected.minQuantity)
                return tier;
            return selected;
        }, null) ?? getFirstPriceTier(variant)
    );
}

function inferCupModel(product?: CartProduct | null) {
    const text =
        `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
    if (text.includes("pp")) return "PP";
    if (text.includes("giay") || text.includes("giấy")) return "Ly giay";
    return "PET";
}

function inferMaterial(product?: CartProduct | null) {
    const text =
        `${product?.name ?? ""} ${product?.categoryName ?? ""}`.toLowerCase();
    if (text.includes("pp")) return "PP";
    if (text.includes("giay") || text.includes("giấy")) return "Giay";
    return "PET";
}

function inferSize(product?: CartProduct | null) {
    const text = `${product?.name ?? ""} ${product?.categoryName ?? ""}`;
    return (
        text
            .match(/(12|16|20)\s?oz|(360|500|700)\s?ml/i)?.[0]
            .replace(/\s+/g, "") ?? "500ml"
    );
}

export default function CartConfiguratorProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<CartProduct | null>(
        null,
    );
    const [configuration, setConfiguration] =
        useState<ConfigState>(initialConfiguration);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        null,
    );
    const [selectedTierMinQuantity, setSelectedTierMinQuantity] = useState<
        number | null
    >(null);
    const [selectedLidId, setSelectedLidId] = useState<number | null>(null);
    const [selectedLidPriceId, setSelectedLidPriceId] = useState<number | null>(
        null,
    );
    const [toast, setToast] = useState<{ name: string } | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const sheetBodyRef = useRef<HTMLDivElement>(null);

    const selectedVariant =
        activeProduct?.variants?.find(
            (variant) => variant.id === selectedVariantId,
        ) ??
        activeProduct?.variants?.[0] ??
        null;
    // Hidden prices have no tier buttons: the tier follows the quantity picked in the select
    const selectedTier =
        (SITE.showPrices
            ? selectedVariant?.priceTiers.find(
                  (tier) => tier.minQuantity === selectedTierMinQuantity,
              )
            : undefined) ??
        getPriceTierForQuantity(selectedVariant, configuration.quantity);
    const activeUnitPrice =
        selectedTier?.unitPrice ?? activeProduct?.price ?? 0;

    const selectedLid =
        activeProduct?.compatibleLids?.find(
            (lid) => lid.id === selectedLidId,
        ) ?? null;
    const selectedLidVariant =
        selectedLid?.variants.find((v) => v.id === selectedLidPriceId) ?? null;
    const lidUnitPrice = selectedLidVariant?.priceTiers[0]?.unitPrice ?? 0;
    const totalUnitPrice = activeUnitPrice + lidUnitPrice;
    // Display only: the add flow below still rounds quantity to whole thousands
    const minOrderQuantity = getMinMoq({
        variants: selectedVariant ? [selectedVariant] : [],
    });

    const getMatchingLidVariants = (lid: ProductDto) => {
        if (!selectedVariant) return lid.variants;
        return lid.variants.filter(
            (v) => v.diameterMm === selectedVariant.diameterMm,
        );
    };

    const openConfigurator = (product: CartProduct) => {
        const firstVariant = product.variants?.[0] ?? null;
        const firstTier = getFirstPriceTier(firstVariant);
        const rawQty =
            product.defaultQuantity ?? firstTier?.minQuantity ?? 1000;
        const quantity = Math.min(
            10000,
            Math.max(1000, Math.ceil(rawQty / 1000) * 1000),
        );

        setActiveProduct(product);
        setSelectedVariantId(firstVariant?.id ?? null);
        setSelectedTierMinQuantity(firstTier?.minQuantity ?? null);
        setSelectedLidId(null);
        setSelectedLidPriceId(null);
        setConfiguration({
            cupModel: firstVariant
                ? `${firstVariant.capacityMl}ml - ${firstVariant.diameterMm}mm`
                : inferCupModel(product),
            size: firstVariant
                ? `${firstVariant.capacityMl}ml`
                : inferSize(product),
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
            quantity: Math.min(
                10000,
                Math.max(
                    current.quantity,
                    Math.ceil(
                        (firstTier?.minQuantity ?? current.quantity) / 1000,
                    ) * 1000,
                ),
            ),
            lidPriceId: undefined,
            lidDiameterMm: undefined,
            lidUnitPrice: undefined,
        }));
    };

    const selectPriceTier = (tier: PriceTierDto) => {
        setSelectedTierMinQuantity(tier.minQuantity);
        setConfiguration((current) => ({
            ...current,
            quantity: Math.min(
                10000,
                Math.ceil(tier.minQuantity / 1000) * 1000,
            ),
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

    // A new object per call, so adding the same item again restarts the timer
    const notifyAdded = (name: string) => setToast({ name });

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

        notifyAdded(activeProduct.name);
        setIsOpen(false);
    };

    const close = () => setIsOpen(false);

    // React state drives the native dialog; showModal() gives focus trap, Escape and focus return
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen && !dialog.open) {
            dialog.showModal();
            sheetBodyRef.current?.scrollTo(0, 0);
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!toast) return;
        const timeout = window.setTimeout(() => setToast(null), TOAST_MS);
        return () => window.clearTimeout(timeout);
    }, [toast]);

    return (
        <CartConfiguratorContext.Provider
            value={{ openConfigurator, notifyAdded }}
        >
            {children}
            <dialog
                ref={dialogRef}
                className="product-config-sheet"
                aria-labelledby="config-title"
                onClose={close}
                onClick={(event) => {
                    // Only the backdrop targets the dialog itself (it has no padding)
                    if (event.target === event.currentTarget) close();
                }}
            >
                {activeProduct ? (
                    <>
                        <header className="sheet-header">
                            <h2 id="config-title">{activeProduct.name}</h2>
                            <button
                                type="button"
                                className="icon-button ghost"
                                aria-label="Đóng"
                                onClick={close}
                            >
                                <CloseIcon width={22} height={22} />
                            </button>
                        </header>

                        <div ref={sheetBodyRef} className="sheet-body">
                            <div className="sheet-product-summary">
                                {activeProduct.imageSrc ? (
                                    <div className="sheet-product-image">
                                        <Image
                                            src={activeProduct.imageSrc}
                                            alt=""
                                            width={220}
                                            height={220}
                                        />
                                    </div>
                                ) : null}
                                <div>
                                    {SITE.showPrices ? (
                                        <p className="sheet-price">
                                            {formatCurrency(totalUnitPrice)} /
                                            ly
                                        </p>
                                    ) : (
                                        <p className="sheet-price price-quote">
                                            {PRICE_HIDDEN_LABEL}
                                        </p>
                                    )}
                                    {minOrderQuantity && minOrderQuantity > 1 ? (
                                        <p className="sheet-moq">
                                            Đặt tối thiểu{" "}
                                            {formatQuantity(minOrderQuantity)}{" "}
                                            ly
                                        </p>
                                    ) : null}
                                    <p className="sheet-specs-row">
                                        <span>{configuration.size}</span>
                                        <span>
                                            {inferMaterial(activeProduct)}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {activeProduct.variants?.length ? (
                                <ControlGroup label="Dung tích">
                                    <div className="sheet-variant-options">
                                        {activeProduct.variants.map(
                                            (variant) => (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    aria-pressed={
                                                        selectedVariant?.id ===
                                                        variant.id
                                                    }
                                                    onClick={() =>
                                                        selectVariant(variant)
                                                    }
                                                >
                                                    <strong>
                                                        {getVariantLabel(
                                                            variant,
                                                        )}
                                                    </strong>
                                                    {SITE.showPrices ? (
                                                        <span>
                                                            Từ{" "}
                                                            {formatCurrency(
                                                                getFirstPriceTier(
                                                                    variant,
                                                                )?.unitPrice ??
                                                                    activeProduct.price,
                                                            )}
                                                            {" / ly"}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </ControlGroup>
                            ) : null}

                            {SITE.showPrices &&
                            selectedVariant?.priceTiers?.length ? (
                                <ControlGroup label="Số lượng & đơn giá">
                                    <div className="sheet-tier-options">
                                        {selectedVariant.priceTiers.map(
                                            (tier) => (
                                                <button
                                                    key={tier.id}
                                                    type="button"
                                                    aria-pressed={
                                                        selectedTier?.id ===
                                                        tier.id
                                                    }
                                                    onClick={() =>
                                                        selectPriceTier(tier)
                                                    }
                                                >
                                                    <span>
                                                        Từ{" "}
                                                        {formatQuantity(
                                                            tier.minQuantity,
                                                        )}{" "}
                                                        ly
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            tier.unitPrice,
                                                        )}
                                                        {" / ly"}
                                                    </strong>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </ControlGroup>
                            ) : null}

                            {SITE.showPrices ? null : (
                                <QuantitySelect
                                    value={configuration.quantity}
                                    onChange={(quantity) =>
                                        setConfiguration((current) => ({
                                            ...current,
                                            quantity,
                                        }))
                                    }
                                />
                            )}

                            <ControlGroup
                                label="Loại in"
                                hint="Phí in sẽ được báo trong báo giá"
                            >
                                <div className="sheet-segmented-options">
                                    {printMethodOptions.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            aria-pressed={
                                                configuration.printMethod ===
                                                option
                                            }
                                            onClick={() =>
                                                updateConfiguration(
                                                    "printMethod",
                                                    option,
                                                )
                                            }
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </ControlGroup>

                            <ControlGroup label="Nắp đi kèm">
                                <div className="sheet-segmented-options sheet-lid-options">
                                    <button
                                        type="button"
                                        aria-pressed={!selectedLidId}
                                        onClick={() => selectLid(null)}
                                    >
                                        Không nắp
                                    </button>
                                    {(activeProduct.compatibleLids ?? []).map(
                                        (lid) => (
                                            <button
                                                key={lid.id}
                                                type="button"
                                                aria-pressed={
                                                    selectedLidId === lid.id
                                                }
                                                onClick={() => selectLid(lid)}
                                            >
                                                {lid.name}
                                            </button>
                                        ),
                                    )}
                                </div>
                                {selectedLid &&
                                getMatchingLidVariants(selectedLid).length >
                                    0 ? (
                                    <div className="sheet-tier-options">
                                        {getMatchingLidVariants(
                                            selectedLid,
                                        ).map((variant) => (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                aria-pressed={
                                                    selectedLidPriceId ===
                                                    variant.id
                                                }
                                                onClick={() =>
                                                    selectLidVariant(variant)
                                                }
                                            >
                                                {SITE.showPrices ? (
                                                    <>
                                                        <span>
                                                            {getLidVariantLabel(
                                                                variant,
                                                            )}
                                                        </span>
                                                        <strong>
                                                            {formatCurrency(
                                                                variant
                                                                    .priceTiers[0]
                                                                    ?.unitPrice ??
                                                                    0,
                                                            )}
                                                            {" / nắp"}
                                                        </strong>
                                                    </>
                                                ) : (
                                                    <strong>
                                                        {getLidVariantLabel(
                                                            variant,
                                                        )}
                                                    </strong>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </ControlGroup>

                            {SITE.showPrices && lidUnitPrice > 0 ? (
                                <div className="sheet-price-breakdown">
                                    <div>
                                        <span>Ly</span>
                                        <span>
                                            {formatCurrency(activeUnitPrice)}
                                        </span>
                                    </div>
                                    <div>
                                        <span>
                                            + Nắp ({selectedLid?.name})
                                        </span>
                                        <span>
                                            {formatCurrency(lidUnitPrice)}
                                        </span>
                                    </div>
                                    <div className="total">
                                        <span>Tổng/ly</span>
                                        <strong>
                                            {formatCurrency(totalUnitPrice)}
                                        </strong>
                                    </div>
                                </div>
                            ) : null}

                            <label className="sheet-note">
                                <span>Ghi chú</span>
                                <textarea
                                    rows={3}
                                    value={configuration.note ?? ""}
                                    onChange={(event) =>
                                        updateConfiguration(
                                            "note",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ghi chú thêm..."
                                />
                            </label>
                        </div>

                        <footer className="sheet-footer">
                            {SITE.showPrices ? (
                                <p className="sheet-footer-summary">
                                    {formatQuantity(configuration.quantity)} ly
                                    ×{" "}
                                    {formatCurrency(totalUnitPrice)}
                                </p>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="button-primary sheet-submit"
                            >
                                {SITE.showPrices
                                    ? `Thêm vào giỏ · ${formatCurrency(
                                          totalUnitPrice *
                                              configuration.quantity,
                                      )}`
                                    : "Thêm vào giỏ"}
                            </button>
                        </footer>
                    </>
                ) : null}
            </dialog>

            <div className="toast" role="status" aria-live="polite">
                {toast ? (
                    <div className="toast-card">
                        <CheckIcon
                            className="toast-icon"
                            width={20}
                            height={20}
                        />
                        <p>Đã thêm {toast.name} vào giỏ</p>
                        <Link href="/cart" onClick={() => setToast(null)}>
                            Xem giỏ hàng
                        </Link>
                    </div>
                ) : null}
            </div>
        </CartConfiguratorContext.Provider>
    );
}

function QuantitySelect({
    value,
    onChange,
}: {
    value: number;
    onChange: (quantity: number) => void;
}) {
    // Keep the current quantity selectable even when it is not a standard option
    const options = [...new Set([...QUANTITY_OPTIONS, value])].sort(
        (a, b) => a - b,
    );

    return (
        <ControlGroup label="Số lượng">
            <div className="quantity-dropdown">
                <select
                    value={value}
                    aria-label="Số lượng"
                    onChange={(event) => onChange(Number(event.target.value))}
                >
                    {options.map((quantity) => (
                        <option key={quantity} value={quantity}>
                            {formatQuantity(quantity)} ly
                        </option>
                    ))}
                </select>
            </div>
        </ControlGroup>
    );
}

function ControlGroup({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    const id = useId();
    return (
        <div
            className="sheet-control-group"
            role="group"
            aria-labelledby={`${id}-label`}
            aria-describedby={hint ? `${id}-hint` : undefined}
        >
            <p id={`${id}-label`} className="sheet-group-label">
                {label}
            </p>
            {children}
            {hint ? (
                <p id={`${id}-hint`} className="sheet-hint">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
