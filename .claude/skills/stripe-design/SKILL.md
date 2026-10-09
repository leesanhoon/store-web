---
name: stripe-design
description: "Stripe-structured design system for In ly DTP — logo forest green #006e3e as primary, navy ink headings, Source Sans 3 (body 400), blue-tinted shadows, 4-8px radii"
---

# Stripe Design System (In ly DTP edition)

## Core Visual Identity

Stripe structure with the logo's colour: clean white canvas, deep navy headings (`#061b31`), forest green primary (`#006e3e`, taken from the logo), Source Sans 3 with a 400 body weight for Vietnamese diacritics, blue-tinted multi-layer shadows.

Overrides `high-end-visual-design` and `redesign-existing-projects`: no Double-Bezel cards, no grain overlay, no pill shapes.

## Color Palette

Only two brand values exist: `--color-primary` and `--color-dark`. Hover, active and soft are derived from primary with `color-mix()`, so never hand-edit them.

### Primary
- **Forest Green** `#006e3e` (`--color-primary`) — CTA background, links, active and selected states. White on it 6.36:1
- **Deep Navy** `#061b31` (`--color-ink`) — headings and prices (NOT black)
- **Pure White** `#ffffff` — page background and cards

### Interactive (derived)
- **Green Hover** `#005a32` (`--color-primary-hover`) — white on it 8.37:1
- **Green Active** `#004d2a` (`--color-primary-active`) — pressed
- **Green Soft** `#ebf3f0` (`--color-primary-soft`) — selected chip, active nav/tab. Never a button fill

### Dark Sections
- **Brand Dark** `#0b2e22` (`--color-dark`) — "Quy trình" band, footer. White on it 14.7:1
- **Dark Body** `#c5d3cc` (`--color-dark-body`) — text on dark (9.5:1)
- **Dark Accent** `#86efac` (`--color-dark-accent`) — links, focus ring and CTA fill on dark (CTA text `#0b2e22`, 10.47:1)

### Neutral Scale
- `#061b31` (`--color-ink`) — headings, prices
- `#273951` (`--color-label`) — form labels, nav links, table headers
- `#425466` (`--color-body`) — paragraphs
- `#5b6b82` (`--color-muted`) — captions, helper text, inactive bottom-nav labels
- `#e5edf5` (`--color-line`) — decorative dividers and card borders only
- `#7c8aa0` (`--color-line-strong`) — input, select and checkbox outlines (3.5:1, WCAG 1.4.11)
- `#f8fafc` (`--color-surface`) — alternate sections, admin canvas

### Status (always text on its soft background, always with an icon)
- **Success** `#0a6b34` on `#e7f5ec` (`--color-success` / `-soft`) — 5.9:1
- **Warning** `#b45309` on `#fffbeb` (`--color-warning` / `-soft`) — pending orders, 4.84:1
- **Danger** `#b91c1c` on `#fef2f2` (`--color-danger` / `-soft`) — errors, destructive buttons (white text)

### Shadows (blue-tinted, layered)
- `--shadow-sm` `0 1px 2px rgba(6,27,49,.06), 0 1px 3px rgba(6,27,49,.08)` — cards at rest (catalog card, AdminCard)
- `--shadow-md` `0 2px 5px -1px rgba(50,50,93,.25), 0 1px 3px -1px rgba(0,0,0,.3)` — mobile `.detail-sticky-cta` bar
- `--shadow-lg` `0 30px 45px -30px rgba(50,50,93,.25), 0 18px 36px -18px rgba(0,0,0,.1)` — card hover, dialogs

### Using tokens in code
- CSS: `var(--color-*)`, `var(--radius-sm|md|lg)`, `var(--shadow-sm|md|lg)`. Tokens live in `app/globals.css` (`@theme static`), area styles in `app/styles/*.css`.
- Tailwind v4 utilities: `bg-primary`, `hover:bg-primary-hover`, `bg-primary-soft`, `text-ink`, `text-label`, `text-body`, `text-muted`, `border-line`, `border-line-strong`, `bg-surface`, `rounded-sm|md|lg`, `shadow-sm|md|lg`. Raw vars use `-(--x)`, never the v3 `-[--x]` form.
- Never add new hex literals in components.

## Typography

Font: `Source Sans 3` only, loaded once with `next/font` in `app/layout.tsx` (no Google Fonts `<link>`, which would load it twice):
```tsx
import { Source_Sans_3 } from "next/font/google";

const sourceSans = Source_Sans_3({ subsets: ["latin", "vietnamese"], variable: "--font-source-sans", display: "swap" });
// <html lang="vi" className={sourceSans.variable}>
```
It is a variable font (200-900) and its digits are tabular by default, so prices and order tables line up without any feature setting.

### Scale (mobile → desktop)
| Role | Size / line-height | Weight | Notes |
|------|--------------------|--------|-------|
| h1 | 32/40 → 52/60 | 400 → 300 | −0.02em; 300 only at ≥40px |
| h2 | 26/32 → 36/44 | 400 | |
| h3 | 20/28 → 24/32 | 500 | |
| h4 / card title | 17 → 18 | 600 | |
| Body | 16/24 | 400 | never 300 |
| Small | 14 | 400 | |
| Caption | 13 minimum | 400 | |
| Label | 14 | 500 | `--color-label` |
| Button | 16 | 600 | min-height 44px (40px at ≥768) |
| Price | 17 on cards, 28-32 on the product page | 600 | `--color-ink`, never green |

### Rules
- Weights 400 / 500 / 600 only; 300 only for display text ≥40px; 700+ banned.
- Line-height ≥1.15 for headings, ≥1.5 for body (two-level Vietnamese diacritics need the room).
- No uppercase or letter-spacing on Vietnamese text. Negative tracking only at ≥32px, capped at −0.02em.
- No `font-feature-settings` (`ss01`, `tnum`): Source Sans 3 has neither feature.

## Components

### Buttons
- **Primary** (`.button-primary`): `#006e3e` bg, white text, 600, 4px radius, min-height 44px (40px at ≥768), hover `#005a32`, active `#004d2a`, disabled opacity 0.6. No scale, no shadow
- **Secondary** (`.button-secondary`): white bg, `1px solid #7c8aa0`, `#061b31` text; hover: green border and text
- **On dark** (`.button-on-dark`): `#86efac` bg, `#0b2e22` text — the only button allowed on dark bands
- **Danger**: `#b91c1c` bg, white text

### Cards
- White bg, `1px solid #e5edf5`, 6px radius (8px for images, modals, sheets), `--shadow-sm`
- Hover (clickable cards): `--shadow-lg` + `translateY(-2px)`
- Flat: no inset highlight, no concentric bezel radii

### Badges
- 4px radius, 13px, status colour on its soft background plus an icon (e.g. success `#0a6b34` on `#e7f5ec`)
- Count badges on the cart icon: `#006e3e` bg, white text, 9999px allowed

### Navigation
- Sticky white header, `rgba(255,255,255,.85)` + `backdrop-filter: blur(12px)`, 1px `#e5edf5` bottom border
- Links 14px weight 500, `#273951`; active `#006e3e` with `aria-current`
- Mobile bottom nav (<768 only): 12px labels, inactive `#5b6b82`, active `#006e3e`

### Inputs
- `1px solid #7c8aa0`, 4px radius, min-height 44px, 16px text (no iOS zoom), every input has a `<label>`
- Invalid: `aria-invalid="true"` → `#b91c1c` border + `.field-error` text (13px, danger)

### Focus
- `outline: 2px solid #006e3e; outline-offset: 2px` on every focusable element; on dark (`.on-dark`) the outline is `#86efac`
- Never `outline: none` without a replacement

## Layout
- Max width: 1080px (`--container`), gutter 16px → 24px at ≥768 → 32px at ≥1024
- Base unit: 8px; sections 48px on mobile, 96px on desktop
- Breakpoints: mobile-first, `min-width: 768px` and `min-width: 1024px`
- Header 56px → 64px at ≥768; bottom nav 64px below 768, hidden above
- Section rhythm: light → dark (`#0b2e22`) → light
- Border radius: 4px-8px (NO pill shapes); 9999px only for avatars, dots and count badges
- Tap targets ≥44px on mobile

## Do's
- Green is primary: CTAs, links, active and selected states in `#006e3e`
- Weight 400 for body, 300 only for display ≥40px
- Blue-tinted shadows everywhere
- `#061b31` not black for headings and prices
- Pair status colours with an icon and their soft background

## Don'ts
- No weight 700+
- No pill shapes (12px+ radius)
- No neutral gray shadows
- No pure black text
- No warm accent for interactive (green is primary)
- No green prices (green means action)
- No `#006e3e` on `#0b2e22` (2.31:1) — on dark bands use only `.button-on-dark` and `#86efac` links
- No soft green (`#ebf3f0`) as a button fill
- No uppercase or letter-spacing on Vietnamese text
- No Double-Bezel cards, grain overlay or pill CTAs (from other design skills)
- No positive letter-spacing at display sizes
