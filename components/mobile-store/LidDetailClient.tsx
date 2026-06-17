"use client";

import { useRef, useState } from "react";
import type { LidDto, LidPriceDto } from "@/lib/api/lids";
import { addToCart, defaultCartConfiguration } from "@/lib/cart";
import { formatCurrency } from "@/lib/products/display";

const QUANTITY_OPTIONS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000] as const;
const CONTACT_VALUE = "contact";

type Props = {
    lid: LidDto;
    imageSrc: string;
};

export default function LidDetailClient({ lid, imageSrc }: Props) {
    const sortedPrices = [...lid.prices].sort((a, b) => b.diameterMm - a.diameterMm);
    const [selectedPrice, setSelectedPrice] = useState<LidPriceDto | null>(sortedPrices[0] ?? null);
    const [quantity, setQuantity] = useState(1000);
    const [added, setAdded] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const handleConfirm = () => {
        if (!selectedPrice) return;

        addToCart({
            productId: 0,
            name: lid.name,
            price: selectedPrice.unitPrice,
            categoryName: lid.categoryName,
            unit: "thung",
            quantity,
            imageSrc,
            isLidOnly: true,
            lidOnlyId: lid.id,
            lidOnlyPriceId: selectedPrice.id,
            lidOnlyDiameterMm: selectedPrice.diameterMm,
            configuration: {
                ...defaultCartConfiguration,
                cupModel: `Nắp ⌀${selectedPrice.diameterMm}mm`,
                size: `⌀${selectedPrice.diameterMm}mm`,
                material: "Nắp ly",
                printMethod: "Không in",
                lidOption: lid.name,
                lidId: lid.id,
                lidName: lid.name,
                lidPriceId: selectedPrice.id,
                lidDiameterMm: selectedPrice.diameterMm,
                lidUnitPrice: 0,
            },
        });

        setAdded(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAdded(false), 2000);
    };

    return (
        <>
            {sortedPrices.length > 0 ? (
                <section className="detail-section">
                    <div className="mobile-section-heading">
                        <h3>Chọn kích thước</h3>
                    </div>
                    <div className="lid-size-options">
                        {sortedPrices.map((price) => (
                            <button
                                key={price.id}
                                type="button"
                                className={selectedPrice?.id === price.id ? "active" : undefined}
                                onClick={() => setSelectedPrice(price)}
                            >
                                <strong>⌀{price.diameterMm}mm</strong>
                                <span>{formatCurrency(price.unitPrice)}</span>
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
                    disabled={!selectedPrice}
                    className="button-primary w-full"
                >
                    {added
                        ? "Đã thêm vào giỏ hàng ✓"
                        : selectedPrice
                            ? `Thêm vào giỏ hàng - ${formatCurrency(selectedPrice.unitPrice * quantity)}`
                            : "Chọn kích thước"}
                </button>
            </div>
        </>
    );
}
