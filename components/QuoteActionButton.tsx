"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { createQuoteRequest, CartItem } from "@/lib/cart";
import { syncOrdersFromQuotes } from "@/lib/orders";

type Props = {
    fullName: string;
    phone: string;
    businessName: string;
    note: string;
    items: CartItem[];
    onCreated?: () => void;
    children: ReactNode;
};

export default function QuoteActionButton({
    fullName,
    phone,
    businessName,
    note,
    items,
    onCreated,
    children,
}: Props) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() =>
                startTransition(() => {
                    createQuoteRequest({ fullName, phone, businessName, note, items });
                    syncOrdersFromQuotes();
                    onCreated?.();
                })
            }
            className="button-primary px-6 py-4"
        >
            {isPending ? "Đang gửi..." : children}
        </button>
    );
}
