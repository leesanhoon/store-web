# Bug: API POST /api/v1/orders returns 500 when order contains lid items

## Date: 2026-06-17

## Summary

The `POST /api/v1/orders` endpoint crashes with HTTP 500 when an order item has `productId: 0`. This happens because the frontend now adds lids as separate line items in the cart, and lids don't have a product ID in the Products table — they have a lid ID from the Lids table.

## Steps to Reproduce

```bash
curl -X POST https://backend-api-dotnet9.onrender.com/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test",
    "customerPhone": "0901234567",
    "items": [
      { "productId": 30, "quantity": 1000, "unitPrice": 720, "materialId": null, "printTypeId": null },
      { "productId": 0, "quantity": 1000, "unitPrice": 255, "materialId": null, "printTypeId": null }
    ]
  }'
```

## Actual Result

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "traceId": "00-cc8605f9e6a33eb736c61e1a49b8d315-18522a7e9048c5a8-00"
}
```

## Expected Result

The order should be created successfully, with the lid recorded as a separate line item.

## Root Cause

The backend `CreateOrderItemRequest` only has a `productId` field. There is no `lidId` field to reference lid items from the Lids table. When `productId: 0` is sent, the backend likely tries to look up a product with ID 0 and throws an unhandled exception.

## Proposed Backend Fix

Option A (Recommended): Add `lidId` field to `CreateOrderItemRequest`:

```csharp
public class CreateOrderItemRequest
{
    public int? ProductId { get; set; }   // nullable — null when it's a lid-only item
    public int? LidId { get; set; }       // new field — set when the item is a lid
    public int? LidPriceId { get; set; }  // new field — references the specific lid price/size
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int? MaterialId { get; set; }
    public int? PrintTypeId { get; set; }
}
```

Validation: at least one of `ProductId` or `LidId` must be non-null.

Option B (Quick fix): Allow `productId: 0` or `null` and store the item as a generic line item with just name/price/quantity (no foreign key).

## Frontend Context

When a customer adds a cup with a lid, the frontend now creates 2 cart items:
1. The cup (productId: 30, price: 720)
2. The lid (productId: 0, lidOnlyId: 6, lidOnlyPriceId: 44, price: 255)

The frontend has `lidOnlyId` and `lidOnlyPriceId` available and can send them if the API supports it.

## Current Frontend Workaround

None yet — orders with lids will fail until the backend is updated. A temporary frontend workaround could merge lid price back into the cup's unitPrice (reverting to single-item behavior), but this loses lid tracking in the order.

## Related Files

- Frontend cart model: `lib/cart.ts` (CartItem type with `isLidOnly`, `lidOnlyId`, `lidOnlyPriceId`)
- Frontend order submit: `app/(public)/cart/page.tsx` (handleSubmit builds payload)
- Frontend order API: `lib/api/orders.ts` (CreateOrderItemRequest type)
- Backend endpoint: `POST /api/v1/orders`
- Compatible lids API: `GET /api/v1/Products/{id}/compatible-lids` (returns lid data with `avatarImageUrl`)
