# In ly DTP Quảng Ngãi — Storefront in ly (store-web)

**In ly DTP Quảng Ngãi** is a mobile-first storefront for selling printed plastic/paper cups (ly nhựa PET, PP, ly giấy, nắp ly) and collecting print-on-logo quote requests. The whole experience is designed around a phone-frame shell with a Vietnamese-language UI. It ships with two areas in a single Next.js app: a **customer storefront** (catalog, product detail, cart → quote, order tracking, gallery) and a lightweight **admin area** for managing products, categories, orders and quotes. Catalog data is served by a .NET backend API (with a built-in demo fallback), while cart, wishlist, orders and the admin session live in the browser's `localStorage`.

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, **Turbopack**) — `next@16.2.6` |
| UI library | React 19 (`react@19.2.4`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) with a custom design-token theme |
| HTTP client | axios (`apiClient` wrapper in `lib/api/http.ts`) |
| Data fetching | SWR (client-side revalidation) |
| Components | Radix UI Select (`@radix-ui/react-select`) |
| Language | TypeScript 5 |
| Fonts | `next/font` — Noto Sans (latin + vietnamese subsets) |

---

## Important: this is a customized Next.js

> **Read the docs in `node_modules/next/dist/docs/` before writing or editing any code.**
>
> Per [`AGENTS.md`](./AGENTS.md), this repo runs a customized build of Next.js with breaking changes — APIs, conventions, and file structure may differ from upstream/public Next.js documentation. Always consult the bundled guides in `node_modules/next/dist/docs/` and heed any deprecation notices instead of relying on memory of "stock" Next.js.

---

## Getting started

### Prerequisites

- **Node.js** 20+ (matches `@types/node@^20`)
- npm (lockfile-driven install)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` at the project root (one already exists in this repo). The API base URL is resolved in `lib/api/http.ts` as:

```
NEXT_PUBLIC_API_BASE_URL  ??  NEXT_PUBLIC_API_URL  ??  "https://backend-api-dotnet9.onrender.com"
```

Example `.env.local`:

```dotenv
# Point the app at your backend (e.g. local .NET API on :5289)
NEXT_PUBLIC_API_BASE_URL=https://backend-api-dotnet9.onrender.com
NEXT_PUBLIC_API_URL=https://backend-api-dotnet9.onrender.com

# Set to "1" to log every request/response as a copy-pastable curl command
NEXT_PUBLIC_API_LOGGING=1
```

If no env vars are set, the app falls back to the hosted backend at `https://backend-api-dotnet9.onrender.com`.

### 3. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000** (the dev profile in `.claude/launch.json` runs `npm run dev` on port 3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (`eslint-config-next`) |

---

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Primary base URL for the backend API | `https://backend-api-dotnet9.onrender.com` |
| `NEXT_PUBLIC_API_URL` | Fallback base URL (used when `NEXT_PUBLIC_API_BASE_URL` is unset) | `https://backend-api-dotnet9.onrender.com` |
| `NEXT_PUBLIC_API_LOGGING` | When `"1"`, logs each API request/response as a curl command to the console | unset (logging off) |

All variables are `NEXT_PUBLIC_*`, so they are inlined into the client bundle.

---

## Project structure

```
store-web/
├── app/
│   ├── layout.tsx              # Root layout: <html lang="vi">, Noto Sans, CartConfiguratorProvider
│   ├── globals.css             # Tailwind v4 import + design-token @theme (navy/accent/radius)
│   ├── (public)/               # Customer storefront route group
│   │   ├── layout.tsx          # Skip-link + <main> wrapper
│   │   ├── page.tsx            # Home /
│   │   ├── products/           # /products — catalog (search + category filter)
│   │   ├── product/[id]/       # /product/[id] — product detail (options, wishlist, share)
│   │   ├── cart/               # /cart — cart → quote request flow
│   │   ├── track-order/        # /track-order — look up orders by id/phone
│   │   ├── account/            # /account — customer area (wishlist, etc.)
│   │   └── gallery/            # /gallery — printed-cup showcase
│   └── admin/                  # Admin area
│       ├── layout.tsx          # Admin chrome
│       ├── page.tsx            # Admin dashboard / login gate
│       ├── product/            # Product CRUD
│       ├── products/           # (admin product listing)
│       ├── category/           # Category management
│       └── order/              # Order & quote management
│
├── components/
│   ├── mobile-store/           # Phone-frame storefront UI
│   │   ├── MobileAppShell.tsx  # Phone-frame container
│   │   ├── MobileTopBar.tsx    # Sticky top bar (title + back link)
│   │   ├── MobileCartButton.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductCatalog.tsx  # Client search + category filter pills
│   │   ├── ProductActions.tsx
│   │   ├── ProductOptionButtons.tsx
│   │   └── icons.tsx
│   ├── cart/
│   │   └── CartConfiguratorProvider.tsx  # App-wide cart configurator context
│   ├── admin/
│   │   ├── AdminAuthGate.tsx    # Client-side login gate
│   │   ├── AdminProductClient.tsx
│   │   ├── AdminOrderClient.tsx
│   │   └── admin-ui.tsx        # Shared admin UI primitives
│   ├── AddToCartButton.tsx
│   ├── QuoteActionButton.tsx   # Creates quote (localStorage) + opens Gmail compose
│   ├── ProductPurchasePanel.tsx
│   ├── OrderTimeline.tsx       # Order status stepper
│   ├── GalleryImageCard.tsx
│   └── DtpLogo.tsx
│
└── lib/
    ├── api/
    │   ├── http.ts             # axios client (apiClient) + base URL + curl logging
    │   ├── products.ts         # GET/POST/PUT/DELETE /api/v1/Products (multipart uploads)
    │   ├── categories.ts       # /api/v1/Categories CRUD
    │   ├── orders.ts           # /api/v1/Orders
    │   └── gallery.ts          # /api/v1/Gallery, /api/v1/HomeFeatures
    ├── data/
    │   ├── catalog.ts          # Catalog read helpers (products/categories)
    │   ├── demo-products.ts    # Demo product fallback when API returns nothing
    │   └── gallery.ts
    ├── products/
    │   └── display.ts          # Product display mapping + text normalization
    ├── cart.ts                 # Cart + quote-request state (localStorage)
    ├── orders.ts               # Local order records + status flow (localStorage)
    ├── wishlist.ts             # Wishlist toggle (localStorage)
    └── admin-auth.ts           # Demo admin auth (localStorage flag)
```

---

## Key features

### Customer storefront (`app/(public)/`)

- **Catalog** (`/products`) — real client-side **search** by product name/category plus **category filter** pills (Tất cả / PET / PP / Ly giấy / Nắp ly). Products are loaded from the backend `GET /api/v1/Products`; when the API returns no products, the page falls back to `lib/data/demo-products.ts`.
- **Product detail** (`/product/[id]`) — configurable options (cup model, size, material, print method, lid), **wishlist** toggle and **share**, plus add-to-cart.
- **Cart → Quote** (`/cart`) — build a cart, fill in contact details, and submit a **quote request**. Quotes are persisted to `localStorage`; `QuoteActionButton` also attempts to create an order via the backend (`lib/api/orders.ts`) and opens a **Gmail compose** window pre-filled with the request — degrading gracefully if the backend call fails.
- **Order tracking** (`/track-order`) — look up local order records by id + phone (`lib/orders.ts`).
- **Gallery** (`/gallery`) — showcase of printed cups, sourced from `GET /api/v1/Gallery`.

### Admin area (`app/admin/`)

- **Login gate** — `AdminAuthGate` blocks the admin UI until authenticated (see *Admin access* below).
- **Product management** — create/update/delete products, including **multipart image uploads** (avatar + gallery; JPG/JPEG/PNG/WEBP/GIF validated in `lib/api/products.ts`).
- **Category management** — CRUD against `/api/v1/Categories`.
- **Order & quote management** — review quote requests, advance order status through the workflow stages, and add internal notes / mockup file references.

---

## Data & state

- **Backend API** — a **.NET** service (default `https://backend-api-dotnet9.onrender.com`) provides **products, categories, gallery, home features, and orders** under `/api/v1/*`. Collection responses are unwrapped to handle both bare arrays and `{ value: [...] }` envelopes.
- **Demo fallback** — if the products API returns an empty list, the storefront renders `demoProducts` so the UI is never blank.
- **Browser state (`localStorage`)** — cart, wishlist, locally-tracked orders/quotes, and the admin session are all client-side. Keys in use:

  | Key | Owner | Contents |
  | --- | --- | --- |
  | `dtp_cart_items` | `lib/cart.ts` | Cart items |
  | `dtp_quote_requests` | `lib/cart.ts` | Submitted quote requests |
  | `dtp_orders` | `lib/orders.ts` | Local order records (synced from quotes) |
  | `dtp_wishlist` | `lib/wishlist.ts` | Wishlisted product ids |
  | `cup_store_admin_auth` | `lib/admin-auth.ts` | Admin "logged in" flag |

  Cart and wishlist changes broadcast custom DOM events (`dtp-cart-changed`, `dtp-wishlist-changed`) so the UI stays in sync across components/tabs.

---

## Design system

The storefront and admin share a single, unified theme defined as design tokens in `app/globals.css` (`@theme`):

- **Navy primary** — `--color-ink: #101a36` (with `--color-ink-hover`), used consistently across storefront and admin.
- **Accent** — teal/emerald `--color-accent: #0f766e`, warm surface tones (`#fffdf8`, `#f5efe5`).
- **Radius scale** — `--radius-control: 14px`, `--radius-cta: 16px`, `--radius-card: 18px`, with soft elevation shadows.
- **Mobile phone-frame shell** — `MobileAppShell` renders content inside a centered phone frame with **sticky top bars** (`MobileTopBar`) for a native-app feel on both mobile and desktop.

---

## Admin access

Admin authentication is a **client-side mock gate**, not real security. A single boolean flag is stored in `localStorage` (`cup_store_admin_auth`) once you log in via `AdminAuthGate`, and the demo credentials are configured in `lib/admin-auth.ts`.

> This gate exists only to keep the admin UI out of the way during demos. It performs **no server-side verification** and must not be relied on to protect anything sensitive. Replace it with proper backend authentication before any real deployment.
