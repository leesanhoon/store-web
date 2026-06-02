"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToCart, CartUnit } from "@/lib/cart";

type Props = {
    productId: number;
    name: string;
    price: number;
    categoryName: string;
    unit?: CartUnit;
    quantity?: number;
    label?: string;
    hrefAfterAdd?: string;
};

export default function AddToCartButton({
    productId,
    name,
    price,
    categoryName,
    unit = "cay",
    quantity = 1,
    label = "Thêm vào giỏ",
    hrefAfterAdd = "/cart",
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [added, setAdded] = useState(false);

    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                disabled={isPending}
                onClick={() =>
                    startTransition(() => {
                        addToCart({ productId, name, price, quantity, unit, categoryName });
                        setAdded(true);
                        window.setTimeout(() => setAdded(false), 1400);
                    })
                }
                className="button-primary w-full"
            >
                {isPending ? "Đang thêm..." : label}
            </button>
            {added ? (
                <Link href={hrefAfterAdd} className="text-center text-sm font-medium text-slate-700 hover:text-slate-950">
                    Đã thêm vào giỏ, mở giỏ hàng
                </Link>
            ) : null}
        </div>
    );
}
