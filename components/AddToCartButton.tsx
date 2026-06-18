"use client";

import { useRef } from "react";
import { useCartConfigurator } from "@/components/cart/CartConfiguratorProvider";
import type { ProductDto, ProductVariantDto } from "@/lib/api/products";
import type { CartUnit } from "@/lib/cart";

type Props = {
  productId: number;
  name: string;
  price: number;
  categoryName: string;
  variants?: ProductVariantDto[];
  compatibleLids?: ProductDto[];
  unit?: CartUnit;
  quantity?: number;
  label?: string;
  imageSrc?: string | null;
};

export default function AddToCartButton({
  productId,
  name,
  price,
  categoryName,
  variants,
  compatibleLids,
  unit = "cay",
  quantity = 1000,
  label = "Thêm vào giỏ",
  imageSrc,
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
          variants,
          compatibleLids,
          unit,
          imageSrc,
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
