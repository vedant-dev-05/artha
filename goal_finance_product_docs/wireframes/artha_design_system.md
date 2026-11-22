---
name: "Artha"
description: "A calm, approachable, and trustworthy mobile-first design system for a goal-based financial achievement companion built for young adults in India."
---

## Overview

Artha is a goal-first personal finance companion designed for college students, interns, freelancers, and early-career professionals transitioning toward financial independence. The interface feels like a supportive, clear-headed mentor rather than a strict ledger or corporate bank. It pairs a warm off-white canvas and crisp white cards with deep forest green anchors, soft sage accents, and dark charcoal typography. Generous whitespace, restrained elevation, and plain-spoken INR (₹) figures keep attention on what the user is saving toward, how far they have come, and their next best move.

## Colors

Deep forest green (`#1B4332` / `#012D1D`) anchors primary actions and active goal progress, balanced by soft sage green accents (`#A5D0B9`, `#CFFBE2`) and a warm off-white canvas (`#F9FAF6`) that feels calm and inviting. Dark charcoal (`#1A1C1A`) and muted slate-green (`#414844`) carry all body and secondary text. Semantic status tokens (`success`, `warning`, `error`) are reserved strictly for goal health (`On Track`, `Needs Attention`, `Completed`) and validation states—never decorative fills.

```yaml
colors:
  accent: "#A5D0B9"
  accent-soft: "#CFFBE2"
  on-accent: "#0E3727"
  success: "#1B6B44"
  on-success: "#FFFFFF"
  success-container: "#CFFBE2"
  on-success-container: "#0E3727"
  warning: "#9A5B13"
  on-warning: "#FFFFFF"
  warning-container: "#FEF0D8"
  on-warning-container: "#4A2800"
  light:
    primary: "#012D1D"
    on-primary: "#FFFFFF"
    primary-container: "#1B4332"
    on-primary-container: "#CFFBE2"
    secondary: "#526259"
    on-secondary: "#FFFFFF"
    secondary-container: "#D5E7DB"
    on-secondary-container: "#101E17"
    tertiary: "#401B1B"
    on-tertiary: "#FFFFFF"
    tertiary-container: "#5A302F"
    on-tertiary-container: "#FFEDEB"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
    error-container: "#FFDAD6"
    on-error-container: "#93000A"
    background: "#F9FAF6"
    on-background: "#1A1C1A"
    surface: "#F9FAF6"
    surface-dim: "#DADAD7"
    surface-bright: "#F9FAF6"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F3F4F1"
    surface-container: "#EEEEEB"
    surface-container-high: "#E8E8E5"
    surface-container-highest: "#E2E3E0"
    on-surface: "#1A1C1A"
    surface-variant: "#DDE4DE"
    on-surface-variant: "#414844"
    outline: "#717973"
    outline-variant: "#C1C8C2"
    inverse-surface: "#2F312F"
    inverse-on-surface: "#F0F1EE"
    inverse-primary: "#A5D0B9"
    shadow: "#000000"
    scrim: "#000000"
  dark:
    primary: "#A5D0B9"
    on-primary: "#0E3727"
    primary-container: "#1B4332"
    on-primary-container: "#CFFBE2"
    secondary: "#B9CBBF"
    on-secondary: "#25342C"
    secondary-container: "#3D4D44"
    on-secondary-container: "#E3F5E9"
    tertiary: "#F5B7B4"
    on-tertiary: "#4C2524"
    tertiary-container: "#5A302F"
    on-tertiary-container: "#FFDAD8"
    error: "#FFB4AB"
    on-error: "#690005"
    error-container: "#93000A"
    on-error-container: "#FFDAD6"
    background: "#121412"
    on-background: "#E2E3E0"
    surface: "#121412"
    surface-dim: "#121412"
    surface-bright: "#383A38"
    surface-container-lowest: "#0C0F0D"
    surface-container-low: "#1A1C1A"
    surface-container: "#1E201E"
    surface-container-high: "#282A29"
    surface-container-highest: "#333533"
    on-surface: "#E2E3E0"
    surface-variant: "#414844"
    on-surface-variant: "#C1C8C2"
    outline: "#8B938D"
    outline-variant: "#414844"
    inverse-surface: "#E2E3E0"
    inverse-on-surface: "#2F312F"
    inverse-primary: "#3F6653"
    shadow: "#000000"
    scrim: "#000000"
```

## Typography

**Afacad Flux** brings warm geometric clarity to headings and hero savings totals, paired with **Instrument Sans** for clean, legible body copy and controls on 390px mobile screens. **Spline Sans Mono** is reserved for tabular financial figures, dates, and milestone amounts when monospace alignment aids scanning. All currency amounts, percentages, and dates use `tabular-nums`.

```yaml
typography:
  display-lg:
    fontFamily: "Afacad Flux"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: -0.75px
  display-lg-mobile:
    fontFamily: "Afacad Flux"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Afacad Flux"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Afacad Flux"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.15px
  title-lg:
    fontFamily: "Instrument Sans"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  title-md:
    fontFamily: "Instrument Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Instrument Sans"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  body-md:
    fontFamily: "Instrument Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Instrument Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: "Instrument Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: "Instrument Sans"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0.2px
  mono-md:
    fontFamily: "Spline Sans Mono"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0px
```

## Layout & Spacing

Designed mobile-first for a `390px` smartphone viewport using a single-column fluid grid with `16px` horizontal page margins and `12px`–`16px` vertical section gaps on a strict `4px` / `8px` spacing scale. Primary destination screens share a persistent bottom navigation bar (`Home`, `My Goals`, `Money`, `Coach`, `Profile`) with `88px` bottom scroll clearance so content never hides behind the dock. Task flows (`Goal Creation`, `Feasibility & Plan`) use a focused top bar with a back action and no bottom tab bar.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 12px
  gutter-lg: 16px
  gutter-xl: 24px
  section: 32px
  page-margin: 16px
```

## Elevation & Depth

Hierarchy relies on tonal surface stepping (`surface` `#F9FAF6` → `surface-container-low` `#F3F4F1` → `surface-container-lowest` `#FFFFFF`) paired with hairline `outline-variant` borders (`1px`) and restrained ambient shadows (`shadow-sm` / `0 2px 10px rgba(1,45,29,0.05)`) on primary cards and the persistent bottom navigation bar. Avoid heavy drop shadows, neon glows, or stacked glassmorphism.

## Shapes

Approachable, organic geometry with soft rounded corners: `16px` (`lg`) for primary goal cards and coach callouts, `24px` (`xl`) for hero summary cards and bottom sheets, `12px` (`md`) for inputs and inner tiles, and `9999px` (`full`) for pills, progress bars, and primary buttons.

```yaml
rounded:
  sm: 6px
  DEFAULT: 12px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
```

## Motion & Micro-interaction

Motion is calm, responsive, and purposeful. Button taps and pill selections respond in `100ms`, progress bar fills and card transitions ease out smoothly over `250ms`, and modal sheets enter with a gentle deceleration curve. Nothing loops or pulses for decoration.

```yaml
motion:
  state-change:
    duration: 100ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 250ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tone of voice:** Supportive, clear-headed, and non-judgemental. Speak like a thoughtful friend who is good with money: *"You're ₹4,000 ahead on your Emergency Fund"* rather than *"Budget deficit warning"*.
- **Capitalisation:** Sentence case for headings, cards, and coach messages; concise title case for navigation tabs (`Home`, `My Goals`, `Money`, `Coach`, `Profile`) and status badges (`On Track`, `Needs Attention`, `Completed`).
- **Terminology:** Always use *Goals*, *Milestones*, *Monthly savings*, *Coach*, and *Protected expenses*. Avoid corporate banking jargon (*amortization*, *yield*, *overdraft*).
- **Button and action labels:** Action-oriented verb phrases (*Save ₹2,500 now*, *Accept this plan*, *Adjust target date*, *Ask Coach about a purchase*).
- **Numbers, dates, and units:** Use Indian Rupee formatting with commas (`₹1,25,000`, `₹4,500/mo`) and short month-year dates (`Aug 2027`, `18 Nov`).

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Chip** → `@components/chip.html`: `chip-action`, `chip-input`, `chip-with-icon`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
