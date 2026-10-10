"use client";

import { useId, useState } from "react";
import {
    QUANTITY_OPTIONS,
    useCartConfigurator,
} from "@/components/cart/CartConfiguratorProvider";
import type { ProductDto, ProductVariantDto } from "@/lib/api/products";
import { addToCart, defaultCartConfiguration } from "@/lib/cart";
import { formatCurrency } from "@/lib/products/display";
import { SITE } from "@/lib/site";

const MAX_QUANTITY = QUANTITY_OPTIONS[QUANTITY_OPTIONS.length - 1];

type Props = {
    product: ProductDto;
    imageSrc: string;
};

export default function LidDetailClient({ product, imageSrc }: Props) {
    const { notifyAdded } = useCartConfigurator();
    const sizeHeadingId = useId();
    const quantityId = useId();
    const sortedVariants = [...product.variants].sort(
        (a, b) => b.diameterMm - a.diameterMm,
    );
    const [selectedVariant, setSelectedVariant] =
        useState<ProductVariantDto | null>(sortedVariants[0] ?? null);
    const [quantity, setQuantity] = useState(1000);

    const getUnitPrice = (variant: ProductVariantDto | null) =>
        variant?.priceTiers[0]?.unitPrice ?? 0;

    const handleConfirm = () => {
        if (!selectedVariant) return;
        const unitPrice = getUnitPrice(selectedVariant);

        addToCart({
            productId: product.id,
            name: product.name,
            price: unitPrice,
            categoryName: product.categoryName,
            unit: "thung",
            quantity,
            imageSrc,
            isLidOnly: true,
            lidOnlyId: product.id,
            lidOnlyPriceId: selectedVariant.id,
            lidOnlyDiameterMm: selectedVariant.diameterMm,
            configuration: {
                ...defaultCartConfiguration,
                cupModel: `Nắp ⌀${selectedVariant.diameterMm}mm`,
                size: `⌀${selectedVariant.diameterMm}mm`,
                material: "Nắp ly",
                printMethod: "Không in",
                lidOption: product.name,
                lidId: product.id,
                lidName: product.name,
                lidPriceId: selectedVariant.id,
                lidDiameterMm: selectedVariant.diameterMm,
                lidUnitPrice: 0,
            },
        });

        notifyAdded(product.name);
    };

    return (
        <>
            {sortedVariants.length > 0 ? (
                <div className="detail-section">
                    <h2 id={sizeHeadingId} className="detail-subheading">
                        Chọn kích thước
                    </h2>
                    <div
                        role="group"
                        aria-labelledby={sizeHeadingId}
                        className="lid-size-options"
                    >
                        {sortedVariants.map((variant) => (
                            <button
                                key={variant.id}
                                type="button"
                                aria-pressed={selectedVariant?.id === variant.id}
                                onClick={() => setSelectedVariant(variant)}
                            >
                                <strong>
                                    {variant.sizeName ||
                                        `⌀${variant.diameterMm}mm`}
                                </strong>
                                {SITE.showPrices ? (
                                    <span>
                                        {formatCurrency(getUnitPrice(variant))}{" "}
                                        /nắp
                                    </span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="detail-section">
                <label htmlFor={quantityId} className="detail-subheading">
                    Số lượng
                </label>
                <div className="quantity-dropdown">
                    <select
                        id={quantityId}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                        {QUANTITY_OPTIONS.map((qty) => (
                            <option key={qty} value={qty}>
                                {qty.toLocaleString("vi-VN")} nắp
                            </option>
                        ))}
                    </select>
                </div>
                {SITE.zaloHref ? (
                    <p className="detail-note">
                        Cần trên {MAX_QUANTITY.toLocaleString("vi-VN")} nắp?{" "}
                        <a
                            href={SITE.zaloHref}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Nhắn Zalo
                        </a>
                    </p>
                ) : null}
            </div>

            <div className="detail-sticky-cta">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedVariant}
                    className="button-primary w-full"
                >
                    {!selectedVariant
                        ? "Chọn kích thước"
                        : SITE.showPrices
                          ? `Thêm vào giỏ · ${formatCurrency(getUnitPrice(selectedVariant) * quantity)}`
                          : "Thêm vào giỏ"}
                </button>
            </div>
        </>
    );
}
