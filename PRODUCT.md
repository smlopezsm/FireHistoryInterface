# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + TypeScript + Vite, Tailwind CSS, Mapbox GL JS (3D globe projection, satellite imagery & atmospheric fog), Three.js + React Three Fiber + Drei (official NASA 3D satellite models in GLB format), TanStack Query (remote metadata and caching), i18next + react-i18next (bilingual internationalization with English default), Nginx Alpine (static asset distribution container).

## Users

- **Firefighters, emergency responders & rangers:** evaluate whether the current month or season presents anomalous thermal activity ("worse than normal") in their jurisdiction to coordinate resources and early warning.
- **Land managers and national park administrators:** identify seasonal fire windows, analyze multi-year fire trends, and evaluate fire recurrence patterns across protected ecosystems.
- **Environmental scientists, geospatial analysts & researchers:** require rigorous quantitative historical series, sensor breakdown (MODIS vs. VIIRS), confidence intervals on pre-2012 estimated counts, and structured CSV export with provenance and data versioning.
- **General public, educators & journalists:** understand historical wildfire trends through an accessible, visually immersive Earth observation control room interface without navigating raw orbital telemetry.

## Product Purpose

Provide an immersive and scientific Earth observation interface to explore and download the **harmonized historical record of active fire hot spots in Argentina (2000 to present)**, bridging NASA MODIS (1 km) and VIIRS (375 m) observations onto a unified, comparable scale (VIIRS S-NPP equivalent) for the **NASA Space Apps Challenge 2026: Harmonization of MODIS and VIIRS Hot Spots**. The product combines interactive 3D planetary exploration, regional anomaly diagnostics against historical medians, an annual matrix calendar (2000–today), mission satellite anatomy with exploded vector view, official NASA 3D spacecraft inspection, and structured CSV data exports.

## Positioning

Unlike conventional satellite portals that present disjointed raw data or unnormalized multi-sensor overlays, Fire History Interface provides end-to-end statistical harmonization between MODIS and VIIRS. It makes uncertainty transparent: pre-2012 data (prior to VIIRS launch) is explicitly communicated as estimated with 45° diagonal hatching, prediction intervals, and clear scientific disclaimers (a hot spot is a thermal anomaly detected in an observation cell, not necessarily an individual fire or its active perimeter).

## Operating Context

- Responsive web application optimized for desktop control room monitoring (1440 px target width, double-column layout: 3D globe + area selection on the left, anomaly diagnosis + calendar heatmap on the right) and mobile devices (stacked layout).
- Direct consumption of backend REST API (`/api/v1`) or self-contained offline sample datasets.
- Field environments and operation centers with varying network connectivity: lightweight initial bundle (~95 kB gzip) with code-splitting (`React.lazy`) for heavy 3D satellite visualization modules.

## Capabilities and Constraints

- **Spatial Selection:** Official IGN territory/province dropdown, bounding box / coordinates, and polygon boundary support.
- **Interactive 3D Earth Globe:** Mapbox GL JS globe projection, photorealistic satellite texture, atmospheric fog (`map.setFog`), active hot spots markers with brightness temperature in Kelvin, sensor filter (Harmonized, MODIS, VIIRS), and auto-rotation loop with mouse pause.
- **Temporal & Anomaly Analysis:** Annual calendar heatmap matrix (2000–today, months in columns, years in rows) with accessible table view fallback, and real-time monthly anomaly widget (Categorical: critical, elevated, normal, low, minimum) vs. historical median and IQR.
- **Orbital Satellite Anatomy & Mission Sheet:** Exploded/assembled vector schematic with interactive subsystems (Payload, Solar, Thermal MLI, Comms, AOCS, Propulsion) and side-by-side telemetry (705 km vs 824 km, pass times, swath widths, spatial resolution).
- **3D NASA Spacecraft Inspection:** Interactive Three.js/R3F viewer for official NASA GLB models: **Terra (MODIS)**, **Aqua (MODIS)**, and **Suomi NPP (VIIRS)**.
- **Scientific Transparency:** Pre-2012 data visually identified with 45° diagonal hatching (`.pattern-estimado`). "No data" is strictly never shown as zero. Hot spots are defined as observation cell anomalies.
- **Data Exports:** Structured CSV downloads for calendar matrices and event lists with scientific provenance metadata headers.
- **Internationalization:** English by default (`en`), with one-click bilingual switching to Spanish (`es`).

## Brand Commitments

- **Name:** Fire History Interface (NASA Space Apps Challenge 2026: Harmonization of MODIS and VIIRS Hot Spots).
- **Voice & Tone:** Editorial control room dark aesthetic, scientifically rigorous yet accessible, transparent, restrained, and purposeful.
- **Palette:** Base `#07100F`, surfaces `#0D1816` / `#111E1B`, border `#21312D`, accent `#B8EE68` (lime), MODIS `#68D9D0` (cyan), VIIRS `#FF9C55` (orange), high intensity `#FF6759` (red).
- **Institutional References:** NASA FIRMS (MODIS & VIIRS), NASA EOSDIS / Earth Observatory, NOAA JPSS, and IGN Argentina.

## Evidence on Hand

- Functional specifications in `docs/` (`docs/01-producto.md` to `docs/07-spec-kit.md`).
- Official NASA 3D models downloaded to `public/models/`: `terra.glb`, `aqua.glb`, `suomi.glb`.
- Passing test suite in Vitest (15 unit tests covering app shell, globe, footer, 3D satellites, and schematic).

## Product Principles

1. **Clarity over Raw Jargon:** Clear language that distinguishes thermal observation anomalies from physical fire perimeters; estimated data is always transparently flagged with text, prediction intervals, and texture.
2. **Data Integrity & Honesty:** Missing satellite passes are strictly labeled "no data", never "zero fires"; satellite data version (`data_version`) and agency sources remain continuously visible.
3. **Operational Diagnostic + Deep Historical Context:** Balanced presentation offering instant anomaly triage alongside 24-year historical trends and orbital mechanics insight.
4. **Accessibility & Craft:** Strict WCAG 2.1 AA compliance, high contrast on dark surfaces, non-color-only encoding (45° hatching pattern), keyboard navigation, accessible table view, and respect for `prefers-reduced-motion`.
5. **Lightweight & Modular Delivery:** Heavy 3D visualization and satellite models are code-split and loaded on-demand to maintain an ultra-fast initial page load.

## Accessibility & Inclusion

- Estándar objetivo: WCAG 2.1 AA.
- Contraste de texto ≥ 4.5:1 sobre todas las superficies.
- Paleta secuencial y divergente validada para daltonismo (protanopía, deuteranopía, tritanopía).
- La condición de "dato estimado" nunca se comunica exclusivamente por color: siempre utiliza textura rayada a 45°, descripción textual en tooltips y leyenda visible.
- Navegación íntegra por teclado (Tab, flechas en matriz de calendario y foco visible).
- Tabla alternativa en formato tabular accesible para lectores de pantalla (`aria-label` detallado por celda con valor, sensor y rango).
- Respeto de preferencias de usuario de movimiento reducido (`prefers-reduced-motion`).
