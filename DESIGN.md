---
name: FuegoContinuo
description: Harmonized satellite Earth observation system for MODIS and VIIRS active fire hot spots
colors:
  primary: "#B8EE68"
  primary-hover: "#CBF58C"
  space-base: "#07100F"
  space-surface: "#0D1816"
  space-elevated: "#111E1B"
  space-border: "#21312D"
  space-border-light: "#2A3F3A"
  text-primary: "#EFF5ED"
  text-secondary: "#93A39C"
  text-muted: "#687771"
  sensor-modis: "#68D9D0"
  sensor-viirs: "#FF9C55"
  sensor-high: "#FF6759"
  sensor-mild: "#3D786E"
  sensor-minimum: "#4FA89B"
typography:
  display:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.space-base}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.space-base}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.space-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-panel:
    backgroundColor: "{colors.space-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "20px"
  chip-badge:
    backgroundColor: "{colors.space-elevated}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  input-field:
    backgroundColor: "{colors.space-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: FuegoContinuo

## Overview

**Creative North Star: "Orbital Control Room"**

FuegoContinuo is an Earth observation command center designed to monitor, harmonize, and diagnose active fire hot spots across Argentina from 2000 to the present day. The interface evokes the quiet authority of an orbital flight operations room: deep cosmic void backgrounds (`#07100F`), dense telemetry surfaces (`#0D1816` and `#111E1B`), hairline wireframes (`#21312D`), and luminous focal indicators that cut through the darkness with purposeful scientific clarity.

Rather than resembling a generic SaaS dashboard or an exaggerated sci-fi neon interface, the design maintains strict editorial discipline. Every visual element serves an operational purpose: distinguishing spatial resolution regimes (MODIS 1 km vs. VIIRS 375 m), highlighting statistical anomalies against 24-year historical medians, and rendering uncertainty transparent through tactile hatched textures. 

Interactive 3D planetary exploration (Mapbox GL JS globe projection) and realistic NASA satellite anatomy (Terra, Aqua, Suomi NPP in Three.js) sit side by side with compact telemetry sidebars. The atmosphere is solemn, high-density, and engineered for rapid situational triage by researchers, rangers, and disaster response teams.

**Key Characteristics:**
- **Cosmic Dark Immersion:** Layered deep teal-tinted blacks eliminate eye strain during prolonged monitoring while maximizing dynamic contrast.
- **Instrument Lineage Encoding:** Unmistakable visual pairing of sensor channels (MODIS cyan, VIIRS orange) reinforced by permanent typography and icons, never color alone.
- **Scientific Rigor & Uncertainty Transparency:** Historical estimations prior to 2012 are physically differentiated with 45° diagonal hatching (`.pattern-estimado`), while missing passes are explicitly marked "No Data" rather than zero.
- **Monospace Telemetry Discipline:** All coordinates, timestamps, Kelvin temperatures, and counts use tabular monospace typography to prevent optical jitter.
- **Tactile Precision Controls:** Mechanical button states, crisp 1px borders, and high-visibility lime focus rings for keyboard navigation.

## Colors

The palette balances dark cosmic void surfaces with luminous telemetry accents, assigning distinct spectral channels to satellite instruments and reserving incandescent warmth strictly for thermal hot spots.

### Primary
- **Luminous Observation Lime** (`#B8EE68`): Primary action accent, active navigation states, interactive focus rings, and confirmed selections. Used sparingly to draw immediate operational attention.
- **Observation Lime Hover** (`#CBF58C`): Elevated hover state for primary action buttons and active controls.

### Secondary
- **MODIS Spectral Cyan** (`#68D9D0`): Sensor channel identifier for Terra and Aqua MODIS (1 km resolution) observations, historical baselines, and cool anomaly deviations.
- **VIIRS Telemetry Orange** (`#FF9C55`): Sensor channel identifier for Suomi NPP VIIRS (375 m resolution) observations and elevated warm thermal anomaly warnings.
- **Thermal Anomaly Scarlet** (`#FF6759`): High-intensity thermal hot spot detections, extreme wildfire activity alerts, and critical anomaly thresholds.
- **Mild Thermal Teal** (`#3D786E`): Low-intensity thermal activity, baseline background detections, and lower-quartile historical markers.

### Neutral
- **Deep Cosmic Void** (`#07100F`): Global viewport background and root canvas layer, providing infinite spatial depth.
- **Subsystem Telemetry Surface** (`#0D1816`): Primary container panels, sidebar modules, calendar cards, and modal dialog bodies.
- **Elevated Control Surface** (`#111E1B`): Secondary interactive surfaces, toolbars, input backgrounds, table headers, and chip pill backgrounds.
- **Orbital Wireframe Border** (`#21312D`): Structural 1px hairline borders that define component boundaries without visual clutter.
- **Subtle Telemetry Wireframe** (`#2A3F3A`): Hover state and active boundaries for cards and interactive inputs.
- **High-Contrast Telemetry Light** (`#EFF5ED`): Primary text, headings, prominent metrics, and high-contrast labels (contrast ratio > 12:1 against background).
- **Muted Telemetry Green-Gray** (`#93A39C`): Secondary text, axis labels, explanatory captions, and inactive telemetry metrics.
- **Dim Technical Trace** (`#687771`): Disabled states, tertiary breadcrumbs, and subtle metadata watermarks.

### Named Rules
**The Sensor Distinction Rule.** Never rely solely on color to differentiate MODIS and VIIRS data. Accompany every color token with its literal sensor label (`MODIS` or `VIIRS`), instrument symbol, or spatial footprint annotation (1 km vs. 375 m), and maintain a permanent visible legend.

**The Rarity of Glow Rule.** Ambient luminosity and neon glow are strictly reserved for active thermal anomalies (`#FF6759`) and primary focus indicators. Viewport containers, panels, navigation bars, and resting chrome must remain completely matte and flat.

## Typography

**Display Font:** Manrope (with `-apple-system`, `BlinkMacSystemFont`, `sans-serif`)  
**Body Font:** DM Sans (with `-apple-system`, `BlinkMacSystemFont`, `sans-serif`)  
**Label/Mono Font:** DM Mono (with `monospace`)  

**Character:** Technical authority meets modern editorial clarity. Geometric Manrope anchors headlines with confidence, humanistic DM Sans ensures long-form reading comfort, and fixed-width DM Mono delivers jitter-free telemetry readouts.

### Hierarchy
- **Display** (ExtraBold 800, `2.25rem` / 36px, line-height `1.15`, letter-spacing `-0.025em`): Mission hero headline and primary section anchors ("Fire leaves traces. Let's make them count.").
- **Headline** (Bold 700, `1.5rem` / 24px, line-height `1.2`, letter-spacing `-0.02em`): Major modal headers, panel titles, and dialog titles.
- **Title** (Bold 700, `1.125rem` / 18px, line-height `1.3`, letter-spacing `-0.015em`): Card titles, telemetry subsystem labels, and satellite names.
- **Body** (Regular 400, `0.875rem` / 14px, line-height `1.6`, letter-spacing `0em`): Scientific explanatory prose, methodology disclaimers, and interactive helper copy (max line length 65–75ch).
- **Label** (Medium 500, `0.75rem` / 12px, line-height `1.4`, letter-spacing `0.025em`): Orbital coordinates, timestamps, Kelvin temperatures, confidence intervals, sensor badges, and table column headers.

### Named Rules
**The Numbers in Monospace Rule.** All coordinates, dates, raw Kelvin temperatures, confidence percentages, and telemetry counters must be rendered in DM Mono. Tabular figure alignment prevents layout jitter during real-time filtering and multi-year comparisons.

## Layout

The spatial layout is engineered around a standard **1440 px maximum desktop container** with generous outer margins (24px to 32px) and a fixed vertical grid rhythm based on 4px/8px increments.

- **Primary Desktop Grid:** Asymmetrical two-column command layout:
  - **Primary Stage (left 58–60%, ~7 columns):** Full-bleed interactive 3D Earth Globe (Mapbox GL JS) with satellite pass overlays, territorial selector, and 3D satellite model inspection HUDs.
  - **Diagnostic Sidebar (right 40–42%, ~5 columns):** Regional thermal anomaly diagnostic card, monthly status gauge, and multi-year calendar matrix (2000–present).
- **Mobile & Tablet Stack:** Below 1024px, columns collapse into a logical vertical stack: 3D globe viewport (min-height 420px), immediate regional status summary, followed by historical calendar exploration and satellite schematics.
- **Z-Index Layering:**
  - Base canvas / Mapbox: `z-0`
  - Floating map controls & badges: `z-10`
  - Header navigation bar: `z-20` (sticky with `backdrop-blur-md`)
  - Tooltips & popovers: `z-30`
  - Full-screen satellite HUD & modal dialogs: `z-50`

## Elevation & Depth

FuegoContinuo adopts a **Tonal Layering & Crisp Wireframe** philosophy. Depth is communicated through subtle luminance stepping between surfaces and razor-sharp 1px structural borders, avoiding blurry or heavy drop shadows that muddy dark visual environments.

- **Level 0 (Base Canvas):** `#07100F` — Infinite void.
- **Level 1 (Card / Sidebar Surfaces):** `#0D1816` with `1px solid #21312D` border — Recessed resting panels.
- **Level 2 (Interactive Modules & Toolbars):** `#111E1B` with `1px solid #2A3F3A` border — Floating map widgets, buttons, and popups.
- **Level 3 (Modal Overlays):** `#0D1816` with `0 12px 32px rgba(0, 0, 0, 0.65)` and `1px solid #21312D`.

### Shadow Vocabulary
- **Thermal Hotspot Glow** (`box-shadow: 0 0 16px rgba(255, 103, 89, 0.45)`): Applied exclusively to active high-intensity fire detections on the globe and timeline pulse markers.
- **Overlay Lift** (`box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65)`): Applied to modal sheets, 3D satellite detail dialogs, and floating coordinate inspectors.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat and matte at rest. Depth is established through subtle 1px wireframe borders and background color stepping, never gratuitous drop shadows.

## Shapes

- **Corner Radii:**
  - `sm` (4px): Inner badge tags, status indicator dots, and nested table cells.
  - `md` (8px): Interactive buttons, select dropdowns, input fields, and tab toggles.
  - `lg` (12px): Sub-panels, secondary containers, and floating HUD toolbars.
  - `xl` (16px): Primary dashboard panels, modal dialog windows, and 3D viewer containers.
  - `full` (9999px): Pill badges, sensor channel chips, and circular control triggers.
- **Borders:** Crisp 1px hairlines (`#21312D` base, `#2A3F3A` hover/active). No double borders or simulated skeuomorphic bevels.
- **Diagnostic Textures:**
  - `.pattern-estimado`: 45° diagonal white hatching with 18% opacity (`repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239, 245, 237, 0.18) 4px, rgba(239, 245, 237, 0.18) 8px)`). Universally applied to indicate pre-2012 modeled or harmonized estimations.

## Components

### Buttons
- **Shape:** Medium rounded corners (8px radius, `rounded-md`).
- **Primary:** High-visibility lime background (`#B8EE68`), dark text (`#07100F`), bold Manrope font (weight 700), padding `8px 16px`.
- **Hover / Focus:** Hover shifts background to `#CBF58C`; focus displays an offset ring (`box-shadow: 0 0 0 2px #07100F, 0 0 0 4px #B8EE68`).
- **Secondary / Ghost:** Elevated surface background (`#111E1B`), border `1px solid #21312D`, light text (`#EFF5ED`), padding `8px 16px`. Hover lightens border to `#2A3F3A` and surface to `#162824`.

### Chips & Sensor Badges
- **Style:** Pill shape (`rounded-full`), background `#111E1B`, border `1px solid #21312D`, padding `4px 10px`, font DM Mono (12px).
- **MODIS Badge:** Cyan dot (`#68D9D0`) + text "MODIS · 1 km".
- **VIIRS Badge:** Orange dot (`#FF9C55`) + text "VIIRS · 375 m".
- **Estimated Data Badge:** Diagonal hatching `.pattern-estimado` + text "Harmonized / Estimated".

### Cards & Panels
- **Corner Style:** Large rounded corners (16px radius, `rounded-xl`).
- **Background:** Subsystem telemetry surface (`#0D1816`).
- **Border:** Uniform 1px hairline (`#21312D`).
- **Internal Padding:** 20px on desktop (`p-5`), 16px on mobile (`p-4`).
- **Shadow Strategy:** Flat at rest; no drop shadows.

### Inputs & Fields
- **Style:** Elevated background (`#111E1B`), 1px border (`#21312D`), radius 8px (`rounded-md`), text `#EFF5ED`, padding `8px 12px`, font DM Sans (14px).
- **Focus:** Crisp border highlight `#B8EE68` with subtle 2px lime glow (`0 0 0 1px #B8EE68`).
- **Disabled:** Surface `#0D1816`, text `#687771`, border `#1A2824`, cursor not-allowed.

### Navigation
- **Style:** Compact sticky header (`h-14`), background `#07100F` with 80% opacity and `backdrop-blur-md`, bottom border `1px solid #21312D`.
- **Typography:** Manrope 14px bold for brand title ("FuegoContinuo"); DM Sans 13px medium for navigation tabs.
- **Language Switcher:** Pill toggle (`EN` / `ES`) with active state highlighted in `#B8EE68` and dark text `#07100F`.

### Heatmap Grid Cell (Signature Component)
- **Geometry:** 24x24px or 28x28px square with 3px border radius.
- **Color Scales:** Stepped thermal palette (Level 1 `#1A332C` to Level 7 `#FF6759`).
- **Uncertainty Texture:** Any cell prior to VIIRS launch (2012) overlays the `.pattern-estimado` 45° diagonal hatching.
- **Accessibility:** Interactive tooltip displaying year, month, observed count, baseline median, and full screen-reader `aria-label`.

### Hot Spot Pulse Marker (Signature Component)
- **Geometry:** Concentric dual-ring circular beacon.
- **Core:** 8px solid dot in Thermal Anomaly Scarlet (`#FF6759`).
- **Pulse Halo:** 24px animated expanding ring with fade-out opacity, pausing when `prefers-reduced-motion` is active.

### Satellite Orbit Schematic (Signature Component)
- **Viewport:** 3D Three.js canvas embedded inside a `#0D1816` container with orbital HUD reticles.
- **Telemetry Callouts:** Monospace coordinates, orbital altitude (705 km Terra/Aqua vs. 824 km Suomi NPP), pass times (10:30 AM / 1:30 PM), and active sensor status.

## Do's and Don'ts

### Do:
- **Do** format all dates, coordinates, pixel counts, and temperatures in DM Mono to preserve clean tabular alignment.
- **Do** accompany MODIS cyan (`#68D9D0`) and VIIRS orange (`#FF9C55`) with text badges or sensor symbols; never rely on color alone.
- **Do** use the 45° diagonal hatching pattern (`.pattern-estimado`) whenever presenting modeled or estimated historical data.
- **Do** mark absent satellite passes explicitly as "No Data", never as "0 fires".
- **Do** reserve `#FF6759` strictly for active thermal anomalies and high-severity wildfire alerts.
- **Do** maintain high contrast (contrast ratio ≥ 4.5:1) for all typography and UI controls against dark surfaces.

### Don't:
- **Don't** use bubbly SaaS cards, purple pastel gradients, or generic neon aesthetic tricks.
- **Don't** add diffuse drop shadows behind resting dashboard panels or navigation bars.
- **Don't** use proportional sans-serif fonts for dynamic numeric counters or time-series data tables.
- **Don't** hide uncertainty or confidence intervals when displaying pre-2012 harmonized fire series.
- **Don't** let 3D planetary controls or satellite canvases obscure mission-critical data tables or regional diagnostic summaries.
