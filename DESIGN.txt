---
version: "alpha"
name: "Aether — Real-Time Telemetry Engine"
description: "Aether Real Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#10B981"
  secondary: "#34D399"
  tertiary: "#F59E0B"
  neutral: "#0A0A0A"
  background: "#0A0A0A"
  surface: "#171717"
  text-primary: "#A3A3A3"
  text-secondary: "#737373"
  border: "#10B981"
  accent: "#10B981"
typography:
  headline-lg:
    fontFamily: "System Font"
    fontSize: "30px"
    fontWeight: 300
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "SFMono-Regular"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: "15px"
  label-md:
    fontFamily: "System Font"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  md: "8px"
spacing:
  base: "4px"
  sm: "1px"
  md: "4px"
  lg: "8px"
  xl: "10px"
  gap: "3px"
  card-padding: "11px"
  section-padding: "32px"
components:
  button-primary:
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "10px"
  card:
    rounded: "12px"
    padding: "16px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #10B981 as the main accent and #0A0A0A as the neutral foundation.

- **Primary (#10B981):** Main accent and emphasis color.
- **Secondary (#34D399):** Supporting accent for secondary emphasis.
- **Tertiary (#F59E0B):** Reserved accent for supporting contrast moments.
- **Neutral (#0A0A0A):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #0A0A0A; Surface: #171717; Text Primary: #A3A3A3; Text Secondary: #737373; Border: #10B981; Accent: #10B981

- **Gradients:** bg-gradient-to-t from-emerald-500/10 to-emerald-400/80, bg-gradient-to-t from-emerald-500/10 to-amber-400/80, bg-gradient-to-br from-emerald-500/20 to-amber-500/10, bg-gradient-to-br from-emerald-500/20 to-amber-500/15 via-neutral-800/20

## Typography

Typography pairs System Font for display hierarchy with SFMono-Regular for supporting content and interface copy.

- **Headlines (`headline-lg`):** System Font, 30px, weight 300, line-height 36px, letter-spacing -0.025em.
- **Body (`body-md`):** SFMono-Regular, 10px, weight 400, line-height 15px.
- **Labels (`label-md`):** System Font, 12px, weight 500, line-height 16px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 4px
- **Scale:** 1px, 4px, 8px, 10px, 12px, 16px, 20px, 24px
- **Section padding:** 32px
- **Card padding:** 11px, 12px, 13px, 16px
- **Gaps:** 3px, 6px, 8px, 12px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #10B981; 1px #262626; 1px #404040; 1px #171717
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(16, 185, 129, 0.1) 0px 10px 15px -3px, rgba(16, 185, 129, 0.1) 0px 4px 6px -4px
- **Blur:** 12px, 24px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 16px radius. Drive the shell with linear-gradient(to right bottom, rgba(16, 185, 129, 0.2), rgba(38, 38, 38, 0.2), rgba(245, 158, 11, 0.15)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px, 8px, 12px, 15px, 16px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** text #0A0A0A, radius 8px, padding 10px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background rgba(10, 10, 10, 0.7), border 1px solid rgba(16, 185, 129, 0.1), radius 12px, padding 16px, shadow none.
- **Card surface:** background rgba(10, 10, 10, 0.8), border 1px solid rgb(23, 23, 23), radius 12px, padding 16px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px, 8px, 12px, 15px, 16px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 200ms. Easing favors ease and 0. Hover behavior focuses on color and stroke changes.

**Motion Level:** moderate

**Durations:** 300ms, 200ms, 2000ms, 150ms, 1000ms

**Easings:** ease, 0, 1), cubic-bezier(0.4, 0.2, 0.6

**Hover Patterns:** color, stroke
