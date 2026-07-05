---
version: alpha
name: store-web
description: Stripe-inspired fintech elegance for a cup printing store web application.
colors:
  primary: "#533afd"
  secondary: "#061b31"
  tertiary: "#ea2261"
  neutral: "#ffffff"
  surface: "#f8fafc"
  muted: "#64748d"
  border: "#e5edf5"
  dark: "#1c1e54"
  success: "#15be53"
  error: "#dc2626"
typography:
  h1:
    fontFamily: "Source Sans 3"
    fontSize: 3rem
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: "-0.96px"
    fontFeature: '"ss01"'
  h2:
    fontFamily: "Source Sans 3"
    fontSize: 2rem
    fontWeight: 300
    lineHeight: 1.10
    letterSpacing: "-0.64px"
    fontFeature: '"ss01"'
  h3:
    fontFamily: "Source Sans 3"
    fontSize: 1.625rem
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: "-0.26px"
    fontFeature: '"ss01"'
  h4:
    fontFamily: "Source Sans 3"
    fontSize: 1.375rem
    fontWeight: 300
    lineHeight: 1.10
    letterSpacing: "-0.22px"
    fontFeature: '"ss01"'
  body:
    fontFamily: "Source Sans 3"
    fontSize: 1rem
    fontWeight: 300
    lineHeight: 1.40
    fontFeature: '"ss01"'
  body-large:
    fontFamily: "Source Sans 3"
    fontSize: 1.125rem
    fontWeight: 300
    lineHeight: 1.40
    fontFeature: '"ss01"'
  caption:
    fontFamily: "Source Sans 3"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.40
    fontFeature: '"ss01"'
  button:
    fontFamily: "Source Sans 3"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.00
    fontFeature: '"ss01"'
  code:
    fontFamily: "Source Code Pro"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 2.00
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
shadows:
  sm:
    - offsetX: 0
      offsetY: 3
      blur: 6
      color: "rgba(23,23,23,0.06)"
  md:
    - offsetX: 0
      offsetY: 15
      blur: 35
      color: "rgba(23,23,23,0.08)"
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
    rounded: "{rounded.sm}"
    padding: 8px
    size: 16px
  button-primary-hover:
    backgroundColor: "#4434d4"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 8px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 8px
  button-ghost-hover:
    backgroundColor: "rgba(83,58,253,0.05)"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 8px
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 24px
  card-outlined:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 24px
  badge-success:
    backgroundColor: "rgba(21,190,83,0.2)"
    textColor: "#108c3d"
    rounded: "{rounded.sm}"
    padding: 2px
---

## Overview

**store-web** is a cup printing e-commerce storefront. The design language
borrows from Stripe's fintech elegance: lightweight typography (weight 300),
saturated purple primary, deep navy headings, and blue-tinted multi-layer
shadows. The aesthetic is premium, trustworthy, and meticulous — every pixel
feels intentional.

## Colors

- **Primary (#533afd):** A saturated blue-violet for CTAs, links, and
  interactive elements. This is the brand anchor.
- **Secondary (#061b31):** Deep navy for all headings — never pure black.
- **Tertiary (#ea2261):** Ruby accent for decorative elements, icons, and
  alerts (not for interactive use).
- **Neutral (#ffffff):** Pure white for page backgrounds and card surfaces.
- **Surface (#f8fafc):** Light gray for secondary surfaces and table rows.
- **Muted (#64748d):** Body text, secondary text, labels.
- **Border (#e5edf5):** Soft blue-gray for all borders and dividers.
- **Dark (#1c1e54):** Deep indigo for dark brand sections, footers.
- **Success (#15be53):** Status badges, success indicators.
- **Error (#dc2626):** Error states and validation.

## Typography

**Source Sans 3** at weight 300 is the signature voice. All text elements
use `font-feature-settings: "ss01"` for the Stripe-inspired alternate glyphs.
Tabular numbers (`"tnum"`) are used for price displays and order counts.

- **Display (h1, 48px/3rem):** Weight 300, tight tracking (-0.96px). For
  hero headlines and page titles.
- **Section (h2, 32px/2rem):** Weight 300, tracking -0.64px. For major
  section headings.
- **Sub-section (h3, 26px):** Weight 300, tracking -0.26px.
- **Card heading (h4, 22px):** Weight 300, tracking -0.22px.
- **Body (16px):** Weight 300-400, line-height 1.40. Standard reading text.
- **Button (16px):** Weight 400, line-height 1.00. UI elements only.
- **Code (12px):** Source Code Pro, weight 500, line-height 2.00.

## Components

### button-primary
- Background: `{colors.primary}` (#533afd)
- Text: white
- Radius: 4px
- Padding: 8px 16px
- Font: 16px, weight 400, `"ss01"`
- Hover: background `#4434d4`

### card
- Background: white
- Border: 1px solid `{colors.border}` (#e5edf5)
- Radius: 6px
- Shadow: `{shadows.lg}` — blue-tinted multi-layer

### badge-success
- Background: `rgba(21,190,83,0.2)`
- Text: `#108c3d`
- Border: `1px solid rgba(21,190,83,0.4)`
- Radius: 4px
- Font: 10px, weight 300

## Do's and Don'ts

### Do
- Apply `font-feature-settings: "ss01"` on every text element
- Use weight 300 as the default for all body and heading text
- Layer shadows with blue-tinted far + neutral near
- Use `#061b31` (deep navy) for headings instead of `#000000`
- Keep border-radius between 4px-8px

### Don't
- Use weight 600-700 for primary text
- Use pill-shaped buttons or large border-radius (12px+)
- Use neutral gray shadows — always tint with blue
- Use pure black for headings
- Use warm accent colors (orange, yellow) for interactive elements
- Apply positive letter-spacing at display sizes — track tight