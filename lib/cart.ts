export type CartUnit = "cay" | "thung";

export type CartConfiguration = {
  cupModel: string;
  size: string;
  material: string;
  printMethod: string;
};

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: CartUnit;
  categoryName: string;
  configuration: CartConfiguration;
};

export type QuoteRequest = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  businessName: string;
  note: string;
  items: CartItem[];
  status: "new" | "quote_requested";
};

export const CART_CHANGED_EVENT = "dtp-cart-changed";

const CART_KEY = "dtp_cart_items";
const QUOTE_KEY = "dtp_quote_requests";

export const defaultCartConfiguration: CartConfiguration = {
  cupModel: "PET",
  size: "500ml",
  material: "PET",
  printMethod: "Không in",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    configuration: {
      ...defaultCartConfiguration,
      ...(item.configuration ?? {}),
    },
  };
}

function notifyCartChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function getCartItemKey(item: Pick<CartItem, "productId" | "unit" | "configuration">) {
  const config = {
    ...defaultCartConfiguration,
    ...(item.configuration ?? {}),
  };

  return [item.productId, item.unit, config.cupModel, config.size, config.material, config.printMethod].join("|");
}

export function getCartItems() {
  return readJson<CartItem[]>(CART_KEY, []).map(normalizeCartItem);
}

export function getCartTotalQuantity(items = getCartItems()) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function saveCartItems(items: CartItem[]) {
  writeJson(CART_KEY, items.map(normalizeCartItem));
  notifyCartChanged();
}

export function addToCart(
  item: Omit<CartItem, "quantity" | "configuration"> & {
    quantity?: number;
    configuration?: CartConfiguration;
  },
) {
  const items = getCartItems();
  const nextItem = normalizeCartItem({
    ...item,
    quantity: item.quantity ?? 1000,
    configuration: item.configuration ?? defaultCartConfiguration,
  });
  const nextKey = getCartItemKey(nextItem);
  const existingIndex = items.findIndex((current) => getCartItemKey(current) === nextKey);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + nextItem.quantity,
    };
  } else {
    items.push(nextItem);
  }

  saveCartItems(items);
  return items;
}

export function updateCartItemQuantity(itemKey: string, quantity: number) {
  const items = getCartItems()
    .map((item) => (getCartItemKey(item) === itemKey ? { ...item, quantity: Math.max(1, quantity) } : item))
    .filter((item) => item.quantity > 0);

  saveCartItems(items);
  return items;
}

export function removeCartItem(itemKey: string) {
  const items = getCartItems().filter((item) => getCartItemKey(item) !== itemKey);
  saveCartItems(items);
  return items;
}

export function clearCart() {
  saveCartItems([]);
}

export function getQuoteRequests() {
  return readJson<QuoteRequest[]>(QUOTE_KEY, []);
}

export function saveQuoteRequests(requests: QuoteRequest[]) {
  writeJson(QUOTE_KEY, requests);
}

export function createQuoteRequest(payload: Omit<QuoteRequest, "id" | "createdAt" | "status">) {
  const request: QuoteRequest = {
    ...payload,
    id: `RQ-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  const requests = [request, ...getQuoteRequests()];
  saveQuoteRequests(requests);
  return request;
}

export function formatUnit(unit: CartUnit) {
  return unit === "thung" ? "Thùng" : "Cây";
}
