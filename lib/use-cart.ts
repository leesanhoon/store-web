import { useMemo, useSyncExternalStore } from "react";
import { CART_CHANGED_EVENT, CART_KEY, getCartItems, type CartItem } from "@/lib/cart";

function subscribe(onChange: () => void) {
  window.addEventListener(CART_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The raw string is the snapshot: it compares equal until the cart really changes.
function getSnapshot() {
  try {
    return window.localStorage.getItem(CART_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot() {
  return null;
}

/** Cart items, or `null` on the server and during hydration (render no count yet). */
export function useCartItems(): CartItem[] | null {
  const raw = useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (raw === null ? null : getCartItems()), [raw]);
}
