# Implementation Plan: Esqueleto de Aplicación y Pipeline de Entrega (W1)

**Branch**: `001-app-skeleton` | **Date**: 2026-11-14 | **Spec**: [specs/001-app-skeleton/spec.md](spec.md)

**Input**: Feature specification from `specs/001-app-skeleton/spec.md` + directivas de `docs/01-05` y `docs/07-spec-kit.md`

## Summary

Implementar la base arquitectónica de la aplicación web en React 18/19 + TypeScript + Vite, configurando internacionalización (`i18next`), TanStack Query para el consumo desacoplado de la API, el layout visual de dos paneles responsive conforme a `docs/02 §1` y tokens de `docs/04`, el pie de página con consumo de `/metadata`, el Dockerfile multi-stage en Nginx Alpine (< 40 MB) y el pipeline de CI en GitHub Actions.

## Technical Context

**Language/Version**: TypeScript 5.5+ / Node.js 22 Alpine (entorno de compilación)

**Primary Dependencies**:
- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `@tanstack/react-query` (gestión de estado de servidor y caché)
- `i18next`, `react-i18next` (internacionalización bilingüe es/en)
- `lucide-react` (iconografía liviana)
- `tailwindcss`, `postcss`, `autoprefixer` (estilos utilitarios y tokens accesibles)

**Storage**: N/A (el frontend consume la API remota vía HTTP y almacena preferencias en `localStorage` / URL search params).

**Testing**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.

**Target Platform**: Navegadores modernos (Chrome, Firefox, Safari, Edge) y contenedor Nginx 1.27 Alpine en Dokploy/Traefik.

**Project Type**: Single Page Application (SPA).

**Performance Goals**: Tiempo de carga inicial < 1s, imagen Docker final < 40 MB, conmutación i18n instantánea (< 50 ms).

**Constraints**:
- Cumplimiento WCAG 2.1 AA (contraste ≥ 4.5:1, etiquetas accesibles).
- Cero acoplamiento de lógica de armonización en frontend (se delega a la API).
- No bloqueos de interfaz con spinners; uso de esqueletos visuales durante la carga.

**Scale/Scope**: Cobertura nacional completa (Argentina), resoluciones desde 360 px hasta monitores 4K.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Evidencia / Justificación |
|---|---|---|
| **I. Claridad para no especialistas** | **PASS** | Textos definidos en i18n sin jerga térmica ("focos de calor detectados por satélite"). |
| **II. Honestidad del dato** | **PASS** | El pie de página integra el endpoint `/metadata` para mostrar siempre `data_version` y fuentes (NASA FIRMS e IGN). |
| **III. Accesible por defecto** | **PASS** | Estructura semántica HTML5, contraste probado en tokens, soporte de navegación accesible. |
| **IV. Contrato de la API como fuente de verdad** | **PASS** | Tipos TypeScript definidos estrictamente en base a `docs/03` y `openapi.json`. |
| **V. Liviano y de alto rendimiento** | **PASS** | Nginx Alpine multi-stage < 40 MB; sin dependencias redundantes. |
| **VI. Estado compartible en la URL** | **PASS** | Parámetro `lang` sincronizado con la URL; preparado para parámetros espaciales y temporales en W2/W3. |
| **VII. Calidad verificada y automatizada** | **PASS** | Configuración de Vitest, ESLint, TypeScript check y GitHub Actions workflow. |

## Project Structure

### Documentation (this feature)

```text
specs/001-app-skeleton/
├── plan.md              # Este plan de implementación
├── research.md          # Decisiones tecnológicas y análisis de alternativas
├── data-model.md        # Entidades (Metadata, AppShellState)
├── quickstart.md        # Guía de validación y comandos
├── contracts/
│   └── metadata-contract.md # Especificación del endpoint /metadata
├── checklists/
│   └── requirements.md  # Checklist de calidad del feature spec
└── tasks.md             # Tareas ejecutables (generado en /speckit-tasks)
```

### Source Code Layout

```text
frontend/
├── .github/
│   └── workflows/
│       └── build-push.yml      # CI/CD (lint, typecheck, test, docker build)
├── nginx/
│   └── default.conf            # Configuración Nginx SPA, gzip, seguridad y /healthz
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts           # Cliente fetch base con VITE_API_BASE_URL
│   │   └── types.ts            # Tipos de la API (espejo del contrato docs/03)
│   ├── app/
│   │   ├── App.tsx             # Shell principal con grid responsive de dos paneles
│   │   ├── providers.tsx       # Proveedores de QueryClient e I18n
│   │   └── layout/
│   │       ├── Header.tsx      # Encabezado institucional + conmutador es/en
│   │       ├── MainLayout.tsx  # Layout split 40% (izq) / 60% (der) en desktop
│   │       └── Footer.tsx      # Pie con metadatos (/metadata), fuentes y data_version
│   ├── features/
│   │   └── placeholders/       # Contenedores provisionales para W2-W6
│   │       ├── ZonePlaceholder.tsx
│   │       ├── MapPlaceholder.tsx
│   │       ├── AnomalyPlaceholder.tsx
│   │       └── CalendarPlaceholder.tsx
│   ├── i18n/
│   │   ├── index.ts            # Inicialización de i18next
│   │   ├── es.json             # Diccionario español (default)
│   │   └── en.json             # Diccionario inglés
│   ├── styles/
│   │   └── index.css           # Tailwind + tokens de docs/04 (escala azul y neutros)
│   ├── index.html              # Entrada HTML principal con viewport y lang dinámico
│   ├── main.tsx               # Montaje React en root
│   └── vite-env.d.ts           # Definición de tipos de variables VITE_*
├── tests/
│   ├── setup.ts                # Setup de Vitest + Testing Library
│   └── App.test.tsx            # Pruebas del shell, renderizado de paneles e i18n
├── .dockerignore
├── .gitignore
├── Dockerfile                  # Multi-stage Node 22 -> Nginx Alpine
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts
```

## Complexity Tracking

No se detectan violaciones a la Constitución ni patrones de complejidad innecesaria. La arquitectura adopta la estructura SPA canónica y desacoplada sugerida en los requerimientos del desafío.
