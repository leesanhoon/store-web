# In ly DTP Quang Ngai — Store Web

Mobile-first e-commerce storefront for a Vietnamese cup & lid printing business. Built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, and **TypeScript 5**.

Customers browse the catalog, configure print options, build a cart, and submit quote requests. An admin panel lets staff manage products, categories, and orders — all within a single Next.js app.

> **UI language:** Vietnamese

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 |
| Styling | Tailwind CSS 4 + custom design tokens |
| HTTP | Axios (`lib/api/http.ts`) |
| Data fetching | SWR (client-side) |
| Components | Radix UI Select |
| Language | TypeScript 5 |
| Fonts | Plus Jakarta Sans (display) + Be Vietnam Pro (body) |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. (Optional) Configure API endpoint
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_BASE_URL if needed

# 3. Run
npm run dev
```

Open **http://localhost:3000**

The app connects to the hosted backend by default (`https://backend-api-dotnet9.onrender.com`). No local backend setup required.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack, port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (flat config) |

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `https://backend-api-dotnet9.onrender.com` |
| `NEXT_PUBLIC_API_URL` | Fallback base URL | same as above |
| `NEXT_PUBLIC_API_LOGGING` | Set `"1"` to log requests as curl commands | off |

---

## Architecture

### Route Groups

**`app/(public)/`** — Customer storefront (server components by default)

| Route | Description |
|---|---|
| `/` | Home page with hero slider, featured products, gallery |
| `/products` | Catalog with search + category filter |
| `/product/[id]` | Product detail — options, wishlist, share, add-to-cart |
| `/cart` | Cart → quote request flow |
| `/track-order` | Order lookup by id/phone |
| `/gallery` | Printed cup showcase |
| `/account` | Customer area (wishlist) |

**`app/admin/`** — Admin dashboard (client-side auth gate)

| Route | Description |
|---|---|
| `/admin` | Dashboard / login |
| `/admin/product` | Product CRUD (multipart image upload) |
| `/admin/products` | Product listing |
| `/admin/category` | Category management |
| `/admin/order` | Order & quote management |

### Data Flow

```
Backend (.NET 9 API)
  └── lib/api/*.ts          ← Typed API modules (axios)
        ├── lib/data/*.ts   ← Server-component data layer
        └── SWR hooks       ← Client-component data fetching

Browser (localStorage)
  ├── Cart + quotes         (lib/cart.ts)
  ├── Orders                (lib/orders.ts)
  ├── Wishlist              (lib/wishlist.ts)
  └── Admin session         (lib/admin-auth.ts)
```

The backend returns inconsistent collection shapes (array, `{items}`, `{value}`, `{Value}`). Each API module includes an `unwrapCollection` helper to normalize responses.

### Component Organization

| Directory | Purpose |
|---|---|
| `components/mobile-store/` | Storefront UI — MobileAppShell, ProductCatalog, HeroSlider, etc. |
| `components/admin/` | Admin panel — AuthGate, ProductClient, OrderClient, shared UI |
| `components/cart/` | CartConfiguratorProvider (wraps root layout) |

---

## Design System

The visual identity is defined as design tokens in `app/globals.css`:

**Typography** — Plus Jakarta Sans for headings, Be Vietnam Pro for body. Both include Vietnamese diacritics.

**Palette** — Two hues only:
- Navy ink `#101a36` — primary text and UI elements
- Teal accent `#0f766e` — interactive elements and highlights

**Cards** — "Double-Bezel" architecture: navy hairline border + inset highlight + navy-tinted shadows + concentric radii.

**Motion** — Spring-based easing (`--ease-spring`, `--ease-out-soft`) with three duration tokens (`--dur-fast`, `--dur-mid`, `--dur-slow`). Transforms and opacity only.

**Layout** — 430px phone-frame shell (`MobileAppShell`) with sticky top bars for a native-app feel on all screen sizes.

---

## Client-Side State

| localStorage Key | Owner | Contents |
|---|---|---|
| `dtp_cart_items` | `lib/cart.ts` | Cart items |
| `dtp_quote_requests` | `lib/cart.ts` | Submitted quote requests |
| `dtp_orders` | `lib/orders.ts` | Local order records |
| `dtp_wishlist` | `lib/wishlist.ts` | Wishlisted product IDs |
| `cup_store_admin_auth` | `lib/admin-auth.ts` | Admin login flag |

Cart and wishlist changes emit custom DOM events (`dtp-cart-changed`, `dtp-wishlist-changed`) for cross-component sync.

---

## Admin Access

Admin auth is a **client-side demo gate** — a boolean flag in localStorage. Credentials are configured in `lib/admin-auth.ts`.

> **Not production-ready.** This gate exists for demo purposes only. It performs no server-side verification. Replace with proper backend authentication before any real deployment.

---

## Project Structure

```
store-web/
├── app/
│   ├── layout.tsx                  # Root layout (<html lang="vi">, fonts, providers)
│   ├── globals.css                 # Tailwind v4 + design tokens
│   ├── (public)/                   # Customer storefront
│   │   ├── page.tsx                # Home
│   │   ├── products/               # Catalog
│   │   ├── product/[id]/           # Product detail
│   │   ├── cart/                   # Cart → quote
│   │   ├── track-order/            # Order tracking
│   │   ├── account/                # Customer area
│   │   └── gallery/                # Gallery
│   └── admin/                      # Admin panel
│       ├── product/                # Product CRUD
│       ├── products/               # Product listing
│       ├── category/               # Category management
│       └── order/                  # Order management
├── components/
│   ├── mobile-store/               # Storefront components
│   ├── admin/                      # Admin components
│   └── cart/                       # Cart provider
└── lib/
    ├── api/                        # API client + typed modules
    │   ├── http.ts                 # Axios client, base URL, curl logging
    │   ├── products.ts             # Products CRUD (multipart upload)
    │   ├── categories.ts           # Categories CRUD
    │   ├── orders.ts               # Orders API
    │   └── gallery.ts              # Gallery + home features
    ├── data/                       # Server-component data helpers
    ├── cart.ts                     # Cart state (localStorage)
    ├── orders.ts                   # Order state (localStorage)
    ├── wishlist.ts                 # Wishlist (localStorage)
    └── admin-auth.ts               # Demo admin auth
```
