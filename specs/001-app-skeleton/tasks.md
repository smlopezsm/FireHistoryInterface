---
description: "Task list for feature implementation: 001-app-skeleton"
---

# Tasks: Esqueleto de Aplicación y Pipeline de Entrega (W1)

**Input**: Design documents from `specs/001-app-skeleton/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pruebas unitarias y de componentes incluidas con Vitest y React Testing Library.

**Organization**: Tareas agrupadas por historia de usuario para garantizar implementación independiente y entrega de MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos independientes sin bloqueo de dependencias incompletas)
- **[Story]**: Historia de usuario a la que pertenece ([US1], [US2], [US3])
- Rutas explícitas de archivos en cada descripción

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto, dependencias y herramientas base de desarrollo

- [X] T001 Inicializar proyecto base con package.json, TypeScript y dependencias en package.json
- [X] T002 [P] Configurar Vite con plugin de React y soporte de build en vite.config.ts
- [X] T003 [P] Configurar TypeScript en tsconfig.json y tsconfig.node.json
- [X] T004 [P] Configurar Tailwind CSS y PostCSS en tailwind.config.ts y postcss.config.js
- [X] T005 [P] Configurar variables de entorno y tipos en src/vite-env.d.ts
- [X] T006 [P] Configurar Vitest y Testing Library en tests/setup.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura transversal crítica requerida antes de las historias de usuario

- [X] T007 Implementar sistema de tokens de diseño y variables CSS de rayado en src/styles/index.css
- [X] T008 [P] Definir tipos del contrato API (Metadata, Zona, Capa, MesArmonizado, etc.) en src/api/types.ts
- [X] T009 [P] Implementar cliente HTTP base para consumo de API con TanStack Query en src/api/client.ts
- [X] T010 [P] Configurar sistema de internacionalización i18next con recursos iniciales en src/i18n/index.ts, src/i18n/es.json y src/i18n/en.json
- [X] T011 Configurar proveedores globales (QueryClientProvider e I18nProvider) en src/app/providers.tsx

**Checkpoint**: Base lista: tipos, estilos, cliente HTTP e i18n disponibles para el armado de vistas.

---

## Phase 3: User Story 1 - Estructura visual de dos paneles responsive e internacionalización (Priority: P1) 🎯 MVP

**Goal**: Proveer el shell visual principal de dos paneles (40% izq / 60% der en escritorio, apilado en móvil) con encabezado e intercambio instantáneo de idioma (es/en).

**Independent Test**: Cargar la aplicación en navegador en ≥ 1024 px y < 768 px, comprobar layout y conmutar idioma entre ES y EN.

### Tests for User Story 1
- [X] T012 [P] [US1] Escribir pruebas unitarias del layout responsive y conmutación de idioma en tests/App.test.tsx

### Implementation for User Story 1
- [X] T013 [P] [US1] Implementar componente de encabezado con selector de idioma en src/app/layout/Header.tsx
- [X] T014 [P] [US1] Implementar componentes contenedores provisionales (placeholders) para zona, mapa, anomalía y calendario en src/features/placeholders/Placeholders.tsx
- [X] T015 [US1] Implementar grid responsive de dos paneles en src/app/layout/MainLayout.tsx
- [X] T016 [US1] Ensamblar aplicación principal y punto de entrada en src/app/App.tsx, src/main.tsx y index.html

**Checkpoint**: User Story 1 completamente funcional como MVP visual interactivo.

---

## Phase 4: User Story 2 - Consulta de metadatos y versión de datos en pie de página (Priority: P2)

**Goal**: Obtener metadatos de `/metadata` con TanStack Query y mostrar `data_version` y fuentes oficiales en el pie de página.

**Independent Test**: Verificar que el pie de página muestre la versión de datos y fuentes satelitales con fallback no bloqueante.

### Tests for User Story 2
- [X] T017 [P] [US2] Escribir pruebas de componente para el pie de página con estados de carga y error en tests/Footer.test.tsx

### Implementation for User Story 2
- [X] T018 [P] [US2] Implementar hook de consulta useMetadata con TanStack Query en src/api/useMetadata.ts
- [X] T019 [US2] Implementar componente de pie de página Footer con visualización de data_version y créditos en src/app/layout/Footer.tsx

**Checkpoint**: Metadatos y pie de página activos con manejo de caché y reintentos.

---

## Phase 5: User Story 3 - Empaquetado ligero en contenedor Nginx y flujo de CI (Priority: P3)

**Goal**: Empaquetar la aplicación en una imagen Docker multi-stage Nginx Alpine (< 40 MB) con `/healthz` y configurar workflow de CI.

**Independent Test**: Compilar contenedor Docker, validar tamaño < 40 MB y respuesta `GET /healthz` = 200 OK.

### Implementation for User Story 3
- [X] T020 [P] [US3] Configurar servidor Nginx con SPA fallback, compresión gzip y endpoint /healthz en nginx/default.conf
- [X] T021 [P] [US3] Crear Dockerfile multi-stage con Node 22 Alpine y Nginx 1.27 Alpine en Dockerfile y .dockerignore
- [X] T022 [P] [US3] Configurar pipeline de integración continua en .github/workflows/build-push.yml

**Checkpoint**: Entregables de despliegue y automatización de CI listos y probados.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final de calidad, compilación de producción y pruebas integradas

- [X] T023 [P] Configurar reglas de ignorado en .gitignore
- [X] T024 Validar ejecución de compilación de producción (npm run build) y pruebas automatizadas (npm test)
- [X] T025 Ejecutar verificación de escenarios de quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Sin dependencias previas.
- **Foundational (Phase 2)**: Depende de Phase 1. Bloquea las historias de usuario.
- **User Story 1 (Phase 3)**: Depende de Phase 2. MVP central.
- **User Story 2 (Phase 4)**: Depende de Phase 2 y se integra al layout de US1.
- **User Story 3 (Phase 5)**: Depende de la estructura del proyecto y archivos de build.
- **Polish (Phase 6)**: Depende de todas las fases anteriores.
