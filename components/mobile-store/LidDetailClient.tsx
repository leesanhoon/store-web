"use client";

import { useRef, useState } from "react";
import type { ProductDto, ProductVariantDto } from "@/lib/api/products";
import { addToCart, defaultCartConfiguration } from "@/lib/cart";
import { formatCurrency } from "@/lib/products/display";

const QUANTITY_OPTIONS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000] as const;
const CONTACT_VALUE = "contact";

type Props = {
    product: ProductDto;
    imageSrc: string;
};

export default function LidDetailClient({ product, imageSrc }: Props) {
    const sortedVariants = [...product.variants].sort((a, b) => b.diameterMm - a.diameterMm);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(sortedVariants[0] ?? null);
    const [quantity, setQuantity] = useState(1000);
    const [added, setAdded] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const getUnitPrice = (variant: ProductVariantDto | null) =>
        variant?.priceTiers[0]?.unitPrice ?? 0;

    const handleConfirm = () => {
        if (!selectedVariant) return;
        const unitPrice = getUnitPrice(selectedVariant);

        addToCart({
            productId: 0,
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

        setAdded(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAdded(false), 2000);
    };

    return (
        <>
            {sortedVariants.length > 0 ? (
                <section className="detail-section">
                    <div className="mobile-section-heading">
                        <h3>Chọn kích thước</h3>
                    </div>
                    <div className="lid-size-options">
                        {sortedVariants.map((variant) => (
                            <button
                                key={variant.id}
                                type="button"
                                className={selectedVariant?.id === variant.id ? "active" : undefined}
                                onClick={() => setSelectedVariant(variant)}
                            >
                                <strong>{variant.sizeName || `⌀${variant.diameterMm}mm`}</strong>
                                <span>{formatCurrency(getUnitPrice(variant))}</span>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="detail-section">
                <div className="mobile-section-heading">
                    <h3>Số lượng</h3>
                </div>
                <div className="quantity-dropdown">
                    <select
                        value={quantity <= 10000 ? quantity : CONTACT_VALUE}
                        onChange={(e) => {
                            if (e.target.value === CONTACT_VALUE) {
                                window.open("https://zalo.me/0905123456", "_blank");
                                return;
                            }
                            setQuantity(Number(e.target.value));
                        }}
                    >
                        {QUANTITY_OPTIONS.map((qty) => (
                            <option key={qty} value={qty}>
                                {qty.toLocaleString("vi-VN")} ly
                            </option>
                        ))}
                        <option value={CONTACT_VALUE}>Trên 10.000 — Liên hệ</option>
                    </select>
                </div>
            </section>

            <div className="detail-sticky-cta">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedVariant}
                    className="button-primary w-full"
                >
                    {added
                        ? "Đã thêm vào giỏ hàng ✓"
                        : selectedVariant
                            ? `Thêm vào giỏ hàng - ${formatCurrency(getUnitPrice(selectedVariant) * quantity)}`
                            : "Chọn kích thước"}
                </button>
            </div>
        </>
    );
}
