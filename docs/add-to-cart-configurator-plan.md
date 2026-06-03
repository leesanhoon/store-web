# Add-To-Cart Configurator Popup and Cart Fly Animation

## Summary
Implement a richer add-to-cart flow for products. Clicking `Them vao gio` opens a popup where the user chooses quantity, cup model, size, material, and printing method. Confirming adds the configured product to cart, plays a fly-to-cart animation toward the header cart icon, and updates the cart badge count immediately.

## Key Changes
- Extend cart item data to store product configuration: quantity option, cup model, size, material, and print method.
- Replace direct add behavior in `AddToCartButton` with a reusable configurator modal.
- Merge cart lines only when product, unit, and all selected configuration options match.
- Dispatch a cart change event after localStorage writes so the header badge can update immediately.
- Add a stable header cart target for fly-to-cart animation.
- Route product detail add flow through the same configurator modal.

## Implementation Notes
- Use existing localStorage cart storage in `lib/cart.ts`; no backend changes.
- Keep fixed UI options first:
  - quantities: `1000`, `2000`, `3000`, `4000`, `5000`
  - cup models: `PET`, `PP`, `Ly giay`, `Ly in logo`
  - sizes: `360ml`, `500ml`, `700ml`
  - materials: `PET`, `PP`, `Giay kraft`, `Giay trang`
  - print methods: `Khong in`, `In 1 mau`, `In 2 mau`, `In full mau`
- Use accessible modal semantics with `role="dialog"`, `aria-modal`, a labelled title, Escape close, and visible focus states.
- Keep cart state synchronized through browser events instead of adding a new state library.

## Test Plan
- Verify homepage, products page, and product detail open the configurator popup.
- Verify all quantity tiers store the selected cup count.
- Verify same product plus same options merges quantity.
- Verify same product plus different options creates a separate cart line.
- Verify cart page displays selected configuration options.
- Verify header badge initializes from localStorage and updates after add, remove, quantity update, and clear.
- Verify fly animation targets the header cart icon on desktop and mobile.
- Verify reduced-motion users skip the animation.
- Run `npm run lint` and `npm run build`.

## Assumptions
- Quantity means number of cups, not the previous `cay/thung` count.
- Popup options are fixed UI fixtures for now, not API-driven.
- Existing quote/cart/order localStorage flow remains in place.
