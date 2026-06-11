# Partner API Integration — Design Spec

## Overview

Integrate the Partner API (`/api/v1/partners`) into the storefront. Replace hardcoded partner data on the homepage with real API data, and add a new partner detail page at `/partner/[id]`.

## API Layer

### `lib/api/partners.ts`

Types matching the backend response:

```ts
PartnerImageDto { id, imageUrl, displayOrder }
PartnerDto { id, name, address, phoneNumber?, description?, avatarImageUrl?, galleryImages[], createdAtUtc }
```

Functions:
- `getPartners(params?: PaginationParams)` → `PaginatedResponse<PartnerDto>` — GET `/api/v1/partners`
- `getPartner(id: number)` → `PartnerDto` — GET `/api/v1/partners/{id}`

Uses `apiClient` from `lib/api/http.ts`. The list endpoint returns `{ items, totalCount, page, pageSize }` which matches the existing `PaginatedResponse<T>` type.

### `lib/data/partners.ts`

Server-component wrappers (same pattern as `lib/data/catalog.ts`):
- `getCatalogPartners()` — fetches all partners (pageSize=100), returns `PartnerDto[]`
- `getCatalogPartner(id)` — fetches single partner, returns `null` on 404

## Homepage Changes

### `PartnersSection` component

- Props change: `{ partners: PartnerDto[] }` instead of `{ products: ProductDto[] }`
- Each partner card shows: avatar image (or initials fallback), name, truncated description
- Cards link to `/partner/{id}`
- Remove hardcoded `partners` array
- Keep the partners-marquee/panel section but feed it from API data

### `app/(public)/page.tsx`

- Add `loadPartners()` async function (same pattern as `loadProducts()`)
- Pass `partners` to `<PartnersSection>`

## Partner Detail Page

### Route: `app/(public)/partner/[id]/page.tsx`

Server component. Structure mirrors product detail page:

1. **MobileAppShell + MobileTopBar** — back to homepage
2. **Hero gallery** — reuse `ProductImageGallery` with partner's avatarImageUrl + galleryImages
3. **Partner info** — eyebrow badge, name (h2), description, address, phone
4. **Info grid** — 3-column: Địa chỉ, SĐT, Ngày tham gia
5. **Sản phẩm gợi ý** — 3 `ProductCard` components from popular products

### Gallery fallback

When partner has no gallery images, show avatar only (no mockup fallback like products).

## CSS

New classes in `globals.css`:
- `.partner-detail-screen` — layout container (mirrors `.product-detail-screen`)
- `.partner-info` — name, description, address block
- `.partner-info-grid` — 3-column spec-like grid for address/phone/date
- `.partner-avatar` — circular avatar on homepage cards with Double-Bezel ring
- Homepage `.partner-card` updates — avatar image instead of mark letters, link styling

Reuse existing classes: `.detail-eyebrow`, `.detail-section`, `.mobile-section-heading`, `.gallery-*`

## Files to create/modify

| File | Action |
|------|--------|
| `lib/api/partners.ts` | Create |
| `lib/data/partners.ts` | Create |
| `app/(public)/partner/[id]/page.tsx` | Create |
| `components/mobile-store/PartnersSection.tsx` | Modify |
| `app/(public)/page.tsx` | Modify |
| `app/globals.css` | Modify |
