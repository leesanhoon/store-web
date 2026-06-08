export const WISHLIST_CHANGED_EVENT = "dtp-wishlist-changed";

const WISHLIST_KEY = "dtp_wishlist";

function readWishlist(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
}

export function getWishlist(): number[] {
  return readWishlist();
}

export function isWishlisted(productId: number): boolean {
  return readWishlist().includes(productId);
}

export function toggleWishlist(productId: number): number[] {
  const ids = readWishlist();
  const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
  writeWishlist(next);
  return next;
}

export function subscribeWishlist(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(WISHLIST_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(WISHLIST_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
