# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Next.js 16)
npm run build        # Production build
npm run lint         # ESLint (flat config, core-web-vitals + typescript)
```

No test framework is configured.

## Architecture

**Next.js 16** app with React 19, Tailwind CSS 4, and TypeScript. Mobile-first e-commerce storefront for a Vietnamese cup/lid printing business ("In ly DTP - CN Quảng Ngãi"). The UI language is Vietnamese.

### Route groups

- `app/(public)/` — customer-facing storefront (server components by default)
- `app/admin/` — admin dashboard wrapped in a phone-frame UI with `AdminAuthGate` (client-side localStorage auth via `lib/admin-auth.ts`)

### Data flow

- **API client**: `lib/api/http.ts` — axios-based `apiClient` with typed generic methods (`get`, `post`, `put`, `patch`, `delete`). All API modules use this. Backend is a .NET 9 API at `NEXT_PUBLIC_API_BASE_URL` (defaults to Render-hosted instance). Set `NEXT_PUBLIC_API_LOGGING=1` to log curl-formatted requests.
- **API modules**: `lib/api/products.ts`, `lib/api/orders.ts`, `lib/api/categories.ts`, `lib/api/gallery.ts` — typed CRUD functions. The backend returns inconsistent collection shapes (array or `{items}` or `{value}` or `{Value}`), so each module has an `unwrapCollection` helper.
- **Data layer**: `lib/data/catalog.ts`, `lib/data/gallery.ts` — thin wrappers over API modules used by server components.
- **Cart**: `lib/cart.ts` — localStorage-based cart with custom event (`CART_CHANGED_EVENT`) for cross-component sync. Cart items are keyed by a composite of productId + unit + all configuration fields.
- **Data fetching on client**: SWR is available and used in admin components.

### Component organization

- `components/mobile-store/` — public storefront components (HeroSlider, ProductCatalog, MobileAppShell, etc.)
- `components/admin/` — admin panel components (AdminAuthGate, AdminProductClient, AdminOrderClient, admin-ui)
- `components/cart/` — CartConfiguratorProvider (wraps the entire app via root layout)

### Styling

Tailwind CSS 4 with `@theme` custom properties in `globals.css`. Design tokens: `--color-brand-*`, `--color-ink`, `--color-surface`, `--radius-*`, `--shadow-*`. Heavy use of custom CSS classes alongside Tailwind utilities.

### Path alias

`@/*` maps to project root (configured in tsconfig.json).
