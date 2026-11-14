# Research & Technical Decisions: Esqueleto de Aplicación (W1)

## Decision 1: Framework de Frontend y Herramientas de Compilación
- **Decisión**: React + TypeScript + Vite.
- **Razón**: Permite compilación ultrarrápida, soporte nativo de variables de entorno (`VITE_API_BASE_URL`), verificación estricta de tipos contra el contrato OpenAPI y generación de paquetes estáticos hiperoptimizados.
- **Alternativas consideradas**:
  - *Next.js / Remix*: Descartados por requerir un servidor Node.js en runtime, elevando el consumo de memoria (> 150 MB) e incumpliendo la meta constitucional de imagen Nginx < 40 MB.
  - *Vanilla JS / HTML*: Descartado por la complejidad de mantener componentes reactivos con estado interactivo compartido (mapa, filtros, calendario) y enlace bidireccional con la URL.

## Decision 2: Gestión de Estado Asíncrono y Caché de API
- **Decisión**: TanStack Query (`@tanstack/react-query`).
- **Razón**: Proporciona control declarativo de estados (`isLoading`, `isError`, `data`), caché en memoria con `staleTime` configurable (1 h para metadatos de `/metadata`), y reintentos automáticos con backoff exponencial ante fallas transitorias (503/504 y caídas de red).
- **Alternativas consideradas**:
  - *SWR*: Similar funcionalidad, pero TanStack Query ofrece mejor integración con tipos TypeScript y herramientas de depuración avanzadas.
  - *fetch nativo con useEffect*: Descartado por requerir código manual propenso a race conditions, sin política unificada de reintentos ni deduplicación de peticiones.

## Decision 3: Internacionalización (i18n)
- **Decisión**: `i18next` y `react-i18next` con archivos de recursos estáticos JSON (`src/i18n/es.json` y `src/i18n/en.json`).
- **Razón**: Idioma predeterminado Español (`es`), conmutación inmediata sin recarga de página, soporte de formateo numérico localizado y preparación para sincronización con el parámetro `lang` en la URL.
- **Alternativas consideradas**:
  - *React Context casero*: Menor peso inicial, pero carece de estándares consolidados de interpolación y pluralización para las siguientes features.

## Decision 4: Estrategia de Contenedor y Despliegue de Estáticos
- **Decisión**: Dockerfile multi-stage con `node:22-alpine` para build y `nginx:1.27-alpine` para runtime, con usuario sin privilegios y endpoint estático `/healthz`.
- **Razón**: Reduce la superficie de ataque y el tamaño final a menos de 25-30 MB (holgadamente por debajo del límite de 40 MB). Configuración de `nginx/default.conf` con `try_files $uri /index.html;`, compresión gzip y directivas de caché inmutables para `/assets/`.
- **Alternativas consideradas**:
  - *Servidor Node/Express estático*: Descartado por sobrecarga de memoria y dependencias innecesarias en producción.

## Decision 5: Sistema de Estilos y Cumplimiento de Accesibilidad
- **Decisión**: Tailwind CSS configurado con los tokens de diseño de `docs/04-diseno-visual-y-accesibilidad.md` y variables CSS para el rayado diagonal a 45°.
- **Razón**: Permite construir con agilidad la retícula responsive de dos paneles (40% / 60% en escritorio, 100% apilado en móvil), garantizando contrastes WCAG 2.1 AA (≥ 4.5:1) mediante paletas semánticas específicas para texto, fondos y estados de advertencia.
