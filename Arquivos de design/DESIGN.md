---
name: Cyber-Sophisticate
colors:
  surface: '#111417'
  surface-dim: '#111417'
  surface-bright: '#37393d'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#282a2e'
  surface-container-highest: '#323539'
  on-surface: '#e1e2e7'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e2e7'
  inverse-on-surface: '#2e3134'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#c2c7ce'
  on-secondary: '#2c3137'
  secondary-container: '#42474d'
  on-secondary-container: '#b1b5bc'
  tertiary: '#f1f6ff'
  on-tertiary: '#2a3139'
  tertiary-container: '#d3dae4'
  on-tertiary-container: '#585f68'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#dee3ea'
  secondary-fixed-dim: '#c2c7ce'
  on-secondary-fixed: '#171c21'
  on-secondary-fixed-variant: '#42474d'
  tertiary-fixed: '#dce3ed'
  tertiary-fixed-dim: '#c0c7d1'
  on-tertiary-fixed: '#151c23'
  on-tertiary-fixed-variant: '#40474f'
  background: '#111417'
  on-background: '#e1e2e7'
  surface-variant: '#323539'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Lexend
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  section-gap: 160px
---

## Brand & Style
This design system targets high-end engineering portfolios, establishing a persona of **Technical Authority**. It balances extreme precision with a commanding, sophisticated aesthetic. 

The style is a fusion of **Modern Minimalism** and **Refined Glassmorphism**. It utilizes a deep, multi-layered dark mode architecture where depth is communicated through light-refraction (glowing borders) rather than traditional shadows. The interface should feel like a high-end command deck—functional, expansive, and flawlessly engineered. Key visual signatures include:
- **Technological Precision:** 1px glowing strokes and technical grid overlays.
- **Atmospheric Depth:** Subtle cyan light-leaks and background blurs that suggest a vast digital space.
- **Strategic High-Contrast:** Heavy use of whitespace (negative space) to focus attention on technical artifacts.

## Colors
The palette is built on a foundation of **Deep Charcoal-Blue** to provide more depth and visual interest than pure black.

- **Primary (#00F0FF):** "Electric Cyan." Reserved for critical actions, status indicators, and thin glowing accents. Use with 4px to 12px blur for glow effects.
- **Neutral / Background (#05070A):** The base canvas.
- **Surface Low (#0A0F14):** Used for large containers and background sections.
- **Surface High (#141B22):** Used for interactive cards and floating elements, typically with 40-60% opacity for glassmorphism effects.
- **Text Primary (#FFFFFF):** High legibility.
- **Text Secondary (#94A3B8):** Used for descriptions and meta-data to maintain hierarchy.

## Typography
The typographic system creates a tension between **bold geometric shapes** and **technical monospaced utility**.

- **Headlines:** Use Lexend for a modern, approachable yet authoritative feel. Display sizes should use tight letter spacing to feel "locked in."
- **Body:** Inter provides a neutral, highly readable foundation for long-form project descriptions.
- **Technical Metadata:** All labels, tags, and code snippets must use JetBrains Mono. This reinforces the "Dev" persona and provides a clear visual distinction from narrative content. Use uppercase for labels to increase the "control panel" aesthetic.

## Layout & Spacing
The layout follows a **Rigid Grid System** inspired by technical blueprints.

- **Grid Background:** A subtle 32px or 64px square grid should be visible in the background (10% opacity) to provide a sense of alignment and structure.
- **Generous Verticals:** Section gaps are intentionally large (160px+) to allow the "Electric Cyan" glows to breathe without cluttering the UI.
- **Mobile Reflow:** On mobile, margins reduce to 20px, and the grid background should scale down or transition to a simple dot-matrix pattern to maintain clarity.
- **Alignment:** Strictly align all elements to the grid lines. Centered layouts are discouraged; use strong left-alignment or asymmetrical balanced layouts for a more professional, "engineered" look.

## Elevation & Depth
Depth is achieved through **Luminance and Refraction** rather than shadow casting.

- **Glassmorphism:** Containers use a background blur (12px to 20px) with a semi-transparent fill (#141B22 at 60% opacity).
- **The "Glow" Stroke:** Elements are defined by a 1px border. Default borders use a low-contrast grey (#FFFFFF at 10%). Active or primary elements use the Electric Cyan (#00F0FF) with a 4px outer blur of the same color.
- **Z-Axis Hierarchy:**
    - Level 0: Background Grid.
    - Level 1: Subtle atmospheric glow clouds (large, soft Cyan blurs).
    - Level 2: Glass cards with thin borders.
    - Level 3: Interactive elements (Buttons, Inputs) with high-intensity glows.

## Shapes
The shape language is **Strict and Precise**. 

Use **Soft (0.25rem)** roundedness for standard UI components to prevent the interface from feeling too "sharp" or aggressive, but keep it minimal to maintain the technical authority. 
- **Buttons and Inputs:** Should use the standard `rounded` (0.25rem) or `sharp` (0) corners.
- **Interactive Tags:** May use `rounded-lg` (0.5rem) to differentiate them from functional inputs.
- **The "Terminal" look:** Avoid pill shapes or circles unless they are status indicators.

## Components
- **Buttons (CTA):** Primary buttons feature a solid Cyan fill with black text. On hover, they emit a strong 12px Cyan glow and slightly increase in brightness. Secondary buttons are ghost-style with a 1px Cyan border and no fill.
- **Technical Badges:** Small, monospaced labels with a #141B22 background and a 1px border. Used for tech stacks (e.g., [ REACT ], [ TYPESCRIPT ]).
- **Cards:** Glassmorphic surfaces with a 1px top-light highlight. Content should be padded by at least 32px to maintain a premium feel.
- **Inputs:** Darker than the background (#000000) with a 1px border that glows Cyan when focused. Use JetBrains Mono for the input text.
- **Status Indicators:** Small circles with an inner glow, used to show "Available for Work" or "System Online" status.
- **Code Blocks:** Integrated terminal windows with a header bar containing three "window control" dots, reinforcing the developer environment aesthetic.