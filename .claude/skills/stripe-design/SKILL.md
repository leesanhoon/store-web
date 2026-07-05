---
name: stripe-design
description: Stripe design system — purple gradient, weight-300 elegance, blue-tinted shadows, fintech premium
---

# Stripe Design System

## Core Visual Identity

Stripe = fintech elegance: clean white canvas, deep navy headings (`#061b31`), signature purple (`#533afd`), weight 300 typography, blue-tinted multi-layer shadows.

## Color Palette

### Primary
- **Stripe Purple** `#533afd` — CTA, links, interactive
- **Deep Navy** `#061b31` — headings (NOT black)
- **Pure White** `#ffffff` — backgrounds

### Dark Sections
- **Brand Dark** `#1c1e54` — footer, immersive sections
- **Dark Navy** `#0d253d` — almost-black with blue undertone

### Accent (decorative only)
- **Ruby** `#ea2261` — icons, alerts
- **Magenta** `#f96bee` — gradients, decorative
- **Magenta Light** `#ffd7ef` — tinted surfaces

### Interactive
- **Purple Hover** `#4434d4`
- **Purple Deep** `#2e2b8c`
- **Purple Light** `#b9b9f9` — subdued hover bg
- **Purple Mid** `#665efd` — range selector

### Neutral Scale
- `#061b31` — headings
- `#273951` — labels
- `#64748d` — body text
- `#e5edf5` — borders
- `#15be53` — success green
- `#108c3d` — success text

### Shadows
- `rgba(50,50,93,0.25)` — signature blue-tinted
- `rgba(0,0,0,0.1)` — secondary layer
- `rgba(23,23,23,0.08)` — ambient
- `rgba(3,3,39,0.25)` — deep elevation

## Typography

Font: `Source Sans 3` (CDN), weight 300 as signature.
```html
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&family=Source+Code+Pro:wght@400;500;700&display=swap" rel="stylesheet">
```

### Scale
| Role | Size | Weight | L-height | L-spacing |
|------|------|--------|----------|-----------|
| Display Hero | 56px | 300 | 1.03 | -1.4px |
| Display Large | 48px | 300 | 1.15 | -0.96px |
| Section Heading | 32px | 300 | 1.10 | -0.64px |
| Sub-heading Large | 26px | 300 | 1.12 | -0.26px |
| Sub-heading | 22px | 300 | 1.10 | -0.22px |
| Body Large | 18px | 300 | 1.40 | normal |
| Body | 16px | 300-400 | 1.40 | normal |
| Button | 16px | 400 | 1.00 | normal |
| Link | 14px | 400 | 1.00 | normal |
| Caption | 13px | 400 | normal | normal |
| Caption Small | 12px | 300-400 | 1.33 | normal |

### Font Features
- `font-feature-settings: "ss01"` on ALL text
- `font-feature-settings: "tnum"` on financial/tabular numbers

## Components

### Buttons
- **Primary**: `#533afd` bg, white text, 8px 16px padding, 4px radius, hover `#4434d4`
- **Ghost**: transparent, `1px solid #b9b9f9`, `#533afd` text, 4px radius
- **Neutral**: transparent, `1px solid rgb(212,222,233)`, `rgba(16,16,16,0.3)` text

### Cards
- White bg, `1px solid #e5edf5`, 4-8px radius
- Shadow: `rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px`

### Badges
- **Neutral**: white bg, `1px solid #f6f9fc`, 4px radius, 11px
- **Success**: `rgba(21,190,83,0.2)` bg, `#108c3d` text, `1px solid rgba(21,190,83,0.4)`, 10px

### Navigation
- Sticky white header with `backdrop-filter: blur(12px)`
- 14px weight 400 links, `#061b31` color

### Inputs
- `1px solid #e5edf5`, 4px radius, focus `#533afd`

## Layout
- Max width: ~1080px
- Base unit: 8px
- Section rhythm: light → dark (`#1c1e54`) → light
- Border radius: 4px-8px (NO pill shapes)

## Do's
- Weight 300 for headlines and body
- Blue-tinted shadows everywhere
- `#061b31` not black for headings
- `ss01` on all text

## Don'ts
- No weight 600+ in sohne-var
- No pill shapes (12px+ radius)
- No neutral gray shadows
- No pure black headings
- No warm accent for interactive (purple is primary)
- No positive letter-spacing at display sizes