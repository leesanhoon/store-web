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
| Fonts | Source Sans 3 via `next/font` (Latin + Vietnamese) |

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
| `/` | Home: static hero, category tiles, featured products, ordering process, partners |
| `/products` | Catalog with search + category filter |
| `/product/[id]` | Product detail — capacities, price tiers, share, add-to-cart |
| `/cart` | Cart → quote request flow |
| `/track-order` | Order lookup by id/phone |
| `/gallery` | Printed cup showcase |

**`app/account/`** — Admin sign-in at `/account`, outside the storefront chrome (the admin gate redirects here)

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
  └── Admin session         (lib/admin-auth.ts)
```

The backend returns inconsistent collection shapes (array, `{items}`, `{value}`, `{Value}`). Each API module includes an `unwrapCollection` helper to normalize responses.

### Component Organization

| Directory | Purpose |
|---|---|
| `components/mobile-store/` | Storefront UI — SiteChrome (header, footer, bottom nav), ProductCatalog, ProductCard, etc. |
| `components/admin/` | Admin panel — AuthGate, ProductClient, OrderClient, shared UI |
| `components/cart/` | CartConfiguratorProvider (wraps root layout) |

---

## Design System

Stripe-inspired structure with the logo's forest green as primary. Full spec: [`DESIGN.md`](DESIGN.md); rules for agents: `.claude/skills/stripe-design/SKILL.md`. Tokens live in `app/globals.css` (`@theme static`).

**Palette** — Primary green `#006e3e` (from the logo; hover, active and soft are derived with `color-mix()`), navy ink `#061b31` for headings and prices, slate body `#425466`, dark forest `#0b2e22` for the process band and footer. Status colours (success, warning, danger) always sit on their soft background with an icon.

**Typography** — Source Sans 3 only, via `next/font` (Vietnamese subset, tabular digits by default). Body 400; weight 300 only for display text ≥40px; 700+ never used.

**Cards** — Flat: white, 1px `#e5edf5` border, 4-8px radius, blue-tinted layered shadows (`--shadow-sm/md/lg`).

**Motion** — Spring-based easing (`--ease-spring`, `--ease-out-soft`) with three duration tokens (`--dur-fast`, `--dur-mid`, `--dur-slow`). Transforms and opacity only.

**Layout** — Responsive, mobile-first (breakpoints 768px and 1024px, 1080px container). `SiteChrome` renders a sticky header, a dark footer and, below 768px, a fixed bottom nav. The admin has a sidebar at ≥1024px and a bottom nav below.

**CSS** — `app/globals.css` imports one file per area from `app/styles/` (`base`, `shell`, `home`, `catalog`, `product`, `configurator`, `cart`, `pages`, `admin`); each file has one owner. Breakpoints use `min-width` only.

---

## Client-Side State

| localStorage Key | Owner | Contents |
|---|---|---|
| `dtp_cart_items` | `lib/cart.ts` | Cart items |
| `dtp_quote_requests` | `lib/cart.ts` | Submitted quote requests |
| `cup_store_admin_token` | `lib/admin-auth.ts` | Admin auth token |

Cart changes emit a custom DOM event (`dtp-cart-changed`) for cross-component sync.

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
│   ├── globals.css                 # Tailwind v4 + design tokens, imports styles/
│   ├── styles/                     # Per-area CSS (base, shell, home, catalog, …, admin)
│   ├── account/                    # Admin sign-in (/account)
│   ├── (public)/                   # Customer storefront
│   │   ├── page.tsx                # Home
│   │   ├── products/               # Catalog
│   │   ├── product/[id]/           # Product detail
│   │   ├── cart/                   # Cart → quote
│   │   ├── track-order/            # Order tracking
│   │   └── gallery/                # Gallery
│   └── admin/                      # Admin panel
│       ├── product/                # Product CRUD
│       ├── products/               # Product listing
│       ├── category/               # Category management
│       └── order/                  # Order management
├── components/
│   ├── mobile-store/               # Storefront components (SiteChrome, catalog, product)
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
    ├── site.ts                     # Contact data (phone, Zalo, address, hours)
    └── admin-auth.ts               # Demo admin auth
```
