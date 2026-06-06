"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartIcon } from "@/components/mobile-store/icons";
import { CART_CHANGED_EVENT, getCartItems } from "@/lib/cart";

export default function MobileCartButton() {
  const [cartQuantity, setCartQuantity] = useState(0);

  useEffect(() => {
    const syncCartQuantity = () => setCartQuantity(getCartItems().length);
    syncCartQuantity();
    window.addEventListener(CART_CHANGED_EVENT, syncCartQuantity);
    window.addEventListener("storage", syncCartQuantity);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, syncCartQuantity);
      window.removeEventListener("storage", syncCartQuantity);
    };
  }, []);

  return (
    <Link href="/cart" className="mobile-cart-button" aria-label="Giỏ hàng">
      <CartIcon className="h-6 w-6" />
      <span>{cartQuantity}</span>
    </Link>
  );
}
