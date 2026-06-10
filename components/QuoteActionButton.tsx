"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { createQuoteRequest, CartItem } from "@/lib/cart";

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
      onClick={() => startTransition(async () => {
        createQuoteRequest({ fullName, phone, businessName, note, items });
        const subject = encodeURIComponent("Yêu cầu báo giá ly in");
        const body = encodeURIComponent([`Họ tên: ${fullName}`, `SĐT: ${phone}`, `Doanh nghiệp: ${businessName}`, `Ghi chú: ${note}`, `---`, ...items.map((item) => `${item.name} x ${item.quantity}`)].join("\n"));
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank", "noreferrer");
        onCreated?.();
      })}
      className="button-primary px-6 py-4"
    >
      {isPending ? "Đang gửi..." : children}
    </button>
  );
}
