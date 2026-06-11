"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRevealOnScroll } from "@/components/mobile-store/useRevealOnScroll";

type Props = {
  children: ReactNode;
  /** Độ trễ stagger (ms) để các khối trồi lên lần lượt. */
  delay?: number;
  className?: string;
};

export default function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRevealOnScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
