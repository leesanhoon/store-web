"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { createQuoteRequest, CartItem } from "@/lib/cart";
import { createOrder } from "@/lib/api/orders";

function mapCartItems(items: CartItem[]) {
    return items.map((item) => ({
        productId: item.productId,
        materialId: null,
        printTypeId: null,
        quantity: item.quantity,
        unitPrice: item.price,
    }));
}

type Props = {
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
    items: CartItem[];
    onCreated?: () => void;
    children: ReactNode;
};

export default function QuoteActionButton({ fullName, phone, businessName, note, items, onCreated, children }: Props) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() =>
                startTransition(async () => {
                    createQuoteRequest({ fullName, phone, businessName, note, items });
                    await createOrder({
                        customerName: fullName,
                        customerPhone: phone,
                        customerEmail: null,
                        note: `${businessName ? `Doanh nghi?p: ${businessName}. ` : ""}${note}`.trim(),
                        items: mapCartItems(items),
                    });
                    onCreated?.();
                })
            }
            className="button-primary px-6 py-4"
        >
            {isPending ? "�ang g?i..." : children}
        </button>
    );
}
