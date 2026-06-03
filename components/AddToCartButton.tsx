"use client";

import { useRef } from "react";
import { useCartConfigurator } from "@/components/cart/CartConfiguratorProvider";
import type { CartUnit } from "@/lib/cart";

type Props = {
    productId: number;
    name: string;
    price: number;
    categoryName: string;
    unit?: CartUnit;
    quantity?: number;
    label?: string;
};

export default function AddToCartButton({
    productId,
    name,
    price,
    categoryName,
    unit = "cay",
    quantity = 1000,
    label = "Thêm vào giỏ",
}: Props) {
    const { openConfigurator } = useCartConfigurator();
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={() =>
                openConfigurator({
                    productId,
                    name,
                    price,
                    categoryName,
                    unit,
                    defaultQuantity: quantity,
                    anchorRect: buttonRef.current?.getBoundingClientRect() ?? null,
                })
            }
            className="button-primary w-full"
        >
            {label}
        </button>
    );
}
