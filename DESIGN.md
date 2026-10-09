---
version: alpha
name: store-web
description: Stripe-inspired structure with the logo's forest green for a cup printing store web application.
colors:
  primary: "#006e3e"
  primary-hover: "#005a32"
  primary-active: "#004d2a"
  primary-soft: "#ebf3f0"
  secondary: "#061b31"
  neutral: "#ffffff"
  surface: "#f8fafc"
  label: "#273951"
  body: "#425466"
  muted: "#5b6b82"
  border: "#e5edf5"
  border-input: "#7c8aa0"
  dark: "#0b2e22"
  dark-body: "#c5d3cc"
  dark-accent: "#86efac"
  success: "#0a6b34"
  success-soft: "#e7f5ec"
  warning: "#b45309"
  warning-soft: "#fffbeb"
  error: "#b91c1c"
  error-soft: "#fef2f2"
typography:
  h1:
    fontFamily: "Source Sans 3"
    fontSize: 3.25rem
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h1-mobile:
    fontFamily: "Source Sans 3"
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Source Sans 3"
    fontSize: 2.25rem
    fontWeight: 400
    lineHeight: 1.22
  h2-mobile:
    fontFamily: "Source Sans 3"
    fontSize: 1.625rem
    fontWeight: 400
    lineHeight: 1.23
  h3:
    fontFamily: "Source Sans 3"
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.33
  h3-mobile:
    fontFamily: "Source Sans 3"
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.4
  h4:
    fontFamily: "Source Sans 3"
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Source Sans 3"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Source Sans 3"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
  button:
    fontFamily: "Source Sans 3"
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.25
  price:
    fontFamily: "Source Sans 3"
    fontSize: 1.0625rem
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 48px
  section-desktop: 96px
shadows:
  sm:
    - offsetX: 0
      offsetY: 1
      blur: 2
      color: "rgba(6,27,49,0.06)"
    - offsetX: 0
      offsetY: 1
      blur: 3
      color: "rgba(6,27,49,0.08)"
  md:
    - offsetX: 0
      offsetY: 2
      blur: 5
      spread: -1
      color: "rgba(50,50,93,0.25)"
    - offsetX: 0
      offsetY: 1
      blur: 3
      spread: -1
      color: "rgba(0,0,0,0.3)"
  lg:
    - offsetX: 0
      offsetY: 30
      blur: 45
      spread: -30
      color: "rgba(50,50,93,0.25)"
    - offsetX: 0
      offsetY: 18
      blur: 36
      spread: -18
      color: "rgba(0,0,0,0.1)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
    height: 44px
  button-secondary-hover:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  button-on-dark:
    backgroundColor: "{colors.dark-accent}"
    textColor: "{colors.dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
    height: 44px
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 24px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
    height: 44px
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  badge-error:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
---

## Overview

**store-web** is the storefront and admin for a Vietnamese cup printing shop
(In ly DTP). It keeps Stripe's structure and discipline — white surfaces,
deep navy headings, a slate text ramp, 4-8px radii, blue-tinted layered
shadows, an 8px grid, a 1080px container and light → dark → light section
rhythm — but the primary colour is the **brand forest green from the logo**
(`#006e3e`). One brand hue appears on the logo, the CTAs and the active
states, so nothing clashes with the header. The result should feel
trustworthy and calm, with the product photos providing the warmth.

The code has only two brand inputs, `--color-primary` and `--color-dark` in
`app/globals.css`. Hover, active and soft variants are derived from primary
with `color-mix()`.

## Colors

CSS token in brackets; Tailwind v4 generates the matching `bg-`/`text-`/`border-` utilities.

- **Primary (#006e3e, `--color-primary`):** Forest green from the logo. CTA
  backgrounds, links, active and selected states. White on it 6.36:1.
  Hover `#005a32` (8.37:1), pressed `#004d2a` (10.02:1).
- **Primary soft (#ebf3f0, `--color-primary-soft`):** Selected chips, active
  nav and tabs. Never a button fill.
- **Secondary (#061b31, `--color-ink`):** Deep navy for headings and prices —
  never pure black (17.37:1).
- **Label (#273951, `--color-label`):** Form labels, nav links, table headers.
- **Body (#425466, `--color-body`):** Paragraphs (7.80:1 on white).
- **Muted (#5b6b82, `--color-muted`):** Captions, helper text, inactive
  bottom-nav labels (5.43:1 on white, 4.81:1 on primary soft).
- **Neutral (#ffffff):** Page background and card surfaces.
- **Surface (#f8fafc, `--color-surface`):** Alternate sections, admin canvas.
- **Border (#e5edf5, `--color-line`):** Decorative dividers and card borders
  only.
- **Border input (#7c8aa0, `--color-line-strong`):** Input, select and
  checkbox outlines (3.5:1, meets WCAG 1.4.11).
- **Dark (#0b2e22, `--color-dark`):** Deep forest for the "Quy trình" band and
  the footer (white 14.7:1). Text on dark is `#c5d3cc` (9.5:1); links, focus
  ring and CTA fill on dark are `#86efac` (10.47:1 with `#0b2e22` text).
- **Success (#0a6b34 on #e7f5ec):** 5.9:1. Always paired with an icon, because
  success and primary share a hue.
- **Warning (#b45309 on #fffbeb):** Pending orders, 4.84:1.
- **Error (#b91c1c on #fef2f2, `--color-danger`):** Errors and validation;
  white on `#b91c1c` for destructive buttons.

**Contrast rule:** `#006e3e` on `#0b2e22` is 2.31:1 and fails. On dark bands
use only `.button-on-dark` and `#86efac` links.

## Typography

**Source Sans 3** is the only family, loaded once through `next/font`
(`Source_Sans_3`, subsets `latin` + `vietnamese`, variable
`--font-source-sans`). It is a variable font (200-900) with tabular digits by
default, so prices and order tables line up without `font-feature-settings`
(the font has no `ss01` or `tnum`).

| Role | Mobile → desktop | Weight |
|---|---|---|
| h1 | 32/40 → 52/60, −0.02em | 400 → 300 |
| h2 | 26/32 → 36/44 | 400 |
| h3 | 20/28 → 24/32 | 500 |
| h4 / card title | 17 → 18 | 600 |
| Body | 16/24 | 400 (never 300) |
| Small | 14 | 400 |
| Caption | 13 minimum | 400 |
| Label | 14 | 500 |
| Button | 16, min-height 44px (40px at ≥768) | 600 |
| Price | 17 on cards, 28-32 on the product page, ink | 600 |

- Weights 400/500/600 only. 300 only for display text ≥40px. 700+ is banned.
- Line-height at least 1.15 for headings and 1.5 for body text, so stacked
  Vietnamese diacritics don't collide.
- No uppercase or letter-spacing on Vietnamese text. Negative tracking only at
  ≥32px, capped at −0.02em.

## Layout

- Mobile-first; breakpoints `min-width: 768px` and `min-width: 1024px`.
- Container 1080px; gutter 16px → 24px (≥768) → 32px (≥1024).
- 8px spacing unit; sections 48px on mobile, 96px on desktop.
- Sticky blurred header (56px → 64px at ≥768); mobile bottom nav (64px)
  below 768 only, with safe-area padding; dark footer.
- Radius 4/6/8px. `9999px` only for avatars, status dots and count badges.
- Tap targets ≥44px on mobile; visible focus on every control
  (`2px solid #006e3e`, offset 2px; `#86efac` on dark).

## Components

### button-primary
- Background: `{colors.primary}` (#006e3e); hover `#005a32`; pressed `#004d2a`
- Text: white, 16px weight 600
- Radius: 4px
- Min-height: 44px (40px at ≥768); padding 8px 16px
- No scale or shadow; disabled at 0.6 opacity

### button-secondary
- Background: white; border `1px solid #7c8aa0`; text `#061b31`
- Hover: green border and text

### button-on-dark
- Background: `#86efac`; text `#0b2e22`
- The only button allowed on `#0b2e22` bands

### card
- Background: white
- Border: 1px solid `{colors.border}` (#e5edf5)
- Radius: 6px (8px for images, modals and sheets)
- Shadow: `{shadows.sm}` at rest; clickable cards lift to `{shadows.lg}` +
  `translateY(-2px)` on hover
- Flat: no inset highlight, no concentric bezel radii

### input
- Border: `1px solid #7c8aa0`; radius 4px; min-height 44px; 16px text
- Every input has a `<label>` (14px weight 500, `#273951`)
- Invalid: `aria-invalid="true"` → `#b91c1c` border + 13px error text

### badge-success / badge-warning / badge-error
- Status colour on its soft background, 4px radius, 13px, with an icon
- Success `#0a6b34` on `#e7f5ec` (5.9:1)

## Do's and Don'ts

### Do
- Use the brand forest green (`#006e3e`) for CTAs, links and active states
- Use weight 400 for body text; 300 only for display text ≥40px
- Layer shadows with blue-tinted far + neutral near
- Use `#061b31` (deep navy) for headings and prices instead of `#000000`
- Keep border-radius between 4px-8px
- Pair every status colour with an icon and its soft background

### Don't
- Use weight 700+ anywhere
- Make prices green — green means action
- Put `#006e3e` on dark bands; on dark use only `.button-on-dark`
- Use the soft green as a button fill
- Use pill-shaped buttons or large border-radius (12px+)
- Use neutral gray shadows — always tint with blue
- Use pure black for headings
- Use warm accent colors (orange, yellow) for interactive elements
- Use uppercase or letter-spacing on Vietnamese text
- Add Double-Bezel cards or grain overlays
- Apply positive letter-spacing at display sizes — track tight
