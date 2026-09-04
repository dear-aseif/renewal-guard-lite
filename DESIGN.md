---
version: "alpha"
name: "Renewal Guard"
description: "Renewal Guard is a dark, offline-first subscription reminder PWA. The interface layers the Archive UI design language onto a dark material base: lime primary accent, warm gold/honey secondary accents, a large radius family with pill controls, Inter typography, and an elevated gradient-border-shell card treatment."
colors:
  primary: "#9EE66E"
  secondary: "#FFD96A"
  tertiary: "#EECB69"
  neutral: "#1D1B16"
  background: "#0A0A0A"
  surface: "#171717"
  text-primary: "#F5F5F5"
  text-secondary: "#A3A3A3"
  text-strong-secondary: "#737373"
  border: "#9EE66E"
  accent: "#9EE66E"
typography:
  display-lg:
    fontFamily: "Inter Variable"
    fontSize: "30px"
    fontWeight: 300
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  body-lg:
    fontFamily: "Inter Variable"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
  body-md:
    fontFamily: "Inter Variable"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "19.5px"
  label-lg:
    fontFamily: "Inter Variable"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
  label-md:
    fontFamily: "Inter Variable"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  shell-outer: "26px"
  shell-inner: "25px"
  card: "22px"
  card-lg: "28px"
  card-xl: "34px"
  pill: "100px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "20px"
  gap: "12px"
  card-padding: "16px"
  section-padding: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: "10px"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: "10px"
  card:
    backgroundColor: "rgba(10, 10, 10, 0.75)"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Elevated
  - Grid: Strong

## Colors

The color system uses dark mode with #9EE66E as the main accent, warm gold #FFD96A and honey #EECB69 as supporting accents, and a near-black neutral foundation carried from the #1D1B16 Archive neutral.

- **Primary (#9EE66E):** Main accent for emphasis and action states. Replaces the former emerald palette, matching the Archive UI design language.
- **Secondary (#FFD96A):** Supporting accent for secondary emphasis, badges, and highlight moments.
- **Tertiary (#EECB69):** Reserved accent for supporting contrast moments.
- **Neutral (#1D1B16):** Texture neutral — used for text on bright accents (buttons) and dark surfaces around the #0A0A0A / #171717 base.

- **Usage:** Background: #0A0A0A; Surface: #171717; Text Primary: #F5F5F5; Text Secondary: #A3A3A3; Border: rgba(158, 230, 110, 0.16); Accent: #9EE66E

- **Semantic status colors (badges):** red/rose (overdue, today), orange (urgent), gold (need top up, soon), violet (review first), lime (ready, upcoming), slate (safe).

## Typography

Typography uses Inter Variable for display, body, and label hierarchy, bundled via `@fontsource-variable/inter` so the typeface remains available offline.

- **Display (`display-lg`):** Inter Variable, 30px, weight 300, line-height 36px, letter-spacing -0.025em.
- **Body (`body-lg`):** Inter Variable, 15px, weight 400, line-height 24px. (`body-md`: 13px / 19.5px.)
- **Labels (`label-lg`):** Inter Variable, 11px, weight 500, line-height 16px, uppercase mono-caps tracking. (`label-md`: 10px.)

## Layout

Layout follows a bounded grid with reusable spacing tokens stepping from a 4px rhythm. Preserve the grid and the elevated material frame before changing ornament or component styling.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 4px
- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 32px
- **Section padding:** 32px
- **Card padding:** 12px, 16px, 24px
- **Gaps:** 12px, 16px, 20px

## Elevation & Depth

Depth is communicated through elevated surfaces and a signature gradient-border shell. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 1px rgba(158, 230, 110, 0.16); 1px #262626; 1px #171717
- **Shadows:** rgba(60, 49, 27, 0.1) 0px 18px 45px 0px; rgba(60, 49, 27, 0.12) 0px 16px 34px 0px; rgba(60, 49, 27, 0.16) 0px 24px 70px 0px
- **Blur:** 12px, 24px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 26px radius. Drive the shell with `linear-gradient(120deg, rgba(158,230,110,0.7), rgba(158,230,110,0.12) 40%, rgba(255,217,106,0.28) 80%, rgba(238,203,105,0.55))` so the edge reads like premium depth instead of a flat stroke. Keep the stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface with a slightly smaller radius (25px) so the gradient only appears as a hairline frame. Applied as the `.gradient-shell` utility.

## Shapes

Shapes rely on a soft-to-controlled radius family anchored by 22px and scaling to 28px and 34px, with pill (100px) reserved for buttons and badges.

- **Corner radii:** 22px, 25px, 26px, 28px, 34px, 100px
- **Icon treatment:** Linear
- **Icon sets:** Inline SVG (custom)

## Components

Anchor interactions to the pill button styles. Reuse the existing elevated card surface recipe for content blocks.

### Buttons
- **Primary:** background #9EE66E, text #1D1B16, radius 100px, padding 10px, elevated shadow with lime tint.
- **Secondary:** background #1D1B16, border 1px rgba(158, 230, 110, 0.3), text #aeea77, radius 100px, padding 10px.
- **Ghost:** transparent, text slate, radius 100px.

### Cards and Surfaces
- **Card surface:** background rgba(10, 10, 10, 0.75), border 1px rgba(158, 230, 110, 0.16), radius 22px, padding 16px, elevated warm shadow.
- **Card surface (interactive):** hover lifts with transition duration 300ms and a stronger shadow; radius 22-28px.
- **Summary/stat cards:** radius 22px (count) and 28px (summary), preserved accent ring when active.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into other palettes or styles.

### Do
- Do use the lime primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the 4px rhythm.
- Do reuse the Elevated surface treatment and gradient-border shell consistently across cards and controls.
- Do keep corner radii within the 22px, 28px, 34px, 100px family, with pill reserved for buttons.
- Do set text on bright accents (lime/gold) to the near-black #1D1B16 for contrast.

### Don't
- Don't reintroduce the former emerald/teal accent palette as a primary motif.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the moderate motion intensity without a deliberate reason.
- Don't place gray text on colored (lime/gold) backgrounds.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 200ms. Easing favors ease-out. Hover behavior focuses on color, border, and subtle lift.

**Motion Level:** moderate

**Durations:** 300ms, 200ms, 1000ms

**Easings:** ease-out, cubic-bezier(0.2, 0.8, 0.2, 1)

**Hover Patterns:** color, stroke, translate