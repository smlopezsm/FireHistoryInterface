# Feature Specification: Esqueleto de Aplicación y Pipeline de Entrega (W1)

**Feature Branch**: `001-app-skeleton`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Crear la app React + TypeScript + Vite con i18n (es/en), TanStack Query, layout de docs/02 §1, pie con /metadata, Dockerfile y Nginx de docs/05 y CI."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estructura visual de dos paneles responsive e internacionalización (Priority: P1)

Como usuario (brigadista, científico o ciudadano), al ingresar a la plataforma veo una estructura visual ordenada de dos paneles (panel izquierdo 40% con controles espaciales/mapa, panel derecho 60% con diagnóstico y análisis histórico), con un encabezado institucional que me permite cambiar de idioma entre Español e Inglés de manera inmediata.

**Why this priority**: Es la base estructural donde se integrarán todos los componentes funcionales subsiguientes (mapa, selector de zona, matriz de calor, gráficos y descargas). Define la jerarquía visual y la adaptabilidad responsive para escritorio y móviles.

**Independent Test**: Cargar la aplicación en resolución de escritorio (≥ 1024 px) y móvil (< 768 px), verificar la disposición espacial en dos paneles o columna única respectivamente, e interactuar con el selector de idioma para comprobar la traducción inmediata de títulos y etiquetas.

**Acceptance Scenarios**:

1. **Given** un navegador en resolución de escritorio (≥ 1024 px), **When** el usuario abre la aplicación, **Then** visualiza el layout dividido en panel izquierdo (40% de ancho) y panel derecho (60% de ancho) con separación visual limpia y sin desbordes.
2. **Given** un dispositivo móvil o ventana estrecha (< 768 px), **When** se visualiza la página, **Then** el contenido se reorganiza fluidamente en una sola columna vertical conservando la legibilidad.
3. **Given** el encabezado principal, **When** el usuario alterna el selector de idioma (ES/EN), **Then** todas las cadenas de texto del layout (títulos, etiquetas y créditos) se actualizan instantáneamente sin recargar la página.

---

### User Story 2 - Consulta de metadatos y versión de datos en pie de página (Priority: P2)

Como usuario interesado en la trazabilidad del dato, visualizo en el pie de página la versión activa de los datos (`data_version`) y los créditos a las fuentes satelitales (NASA FIRMS) y cartográficas (IGN), obtenidos automáticamente desde el backend mediante gestión asíncrona y caché.

**Why this priority**: Responde a los Principios I y II de la Constitución ("Honestidad del dato" y fuentes siempre visibles). Provee la infraestructura de comunicación cliente-servidor mediante TanStack Query.

**Independent Test**: Probar la carga de la aplicación con respuesta simulada del endpoint `/metadata` y verificar que el pie de página muestre la versión de datos exacta y los créditos, manteniendo un estado de carga no bloqueante (skeleton) durante la petición.

**Acceptance Scenarios**:

1. **Given** una respuesta válida del endpoint `/metadata`, **When** se completa la consulta, **Then** el pie de página muestra `Versión de datos: {data_version}` y enlaces a las fuentes oficiales.
2. **Given** una demora en la respuesta de la API, **When** la aplicación está cargando, **Then** se muestra un esqueleto visual no intrusivo en el pie de página sin bloquear la navegación.
3. **Given** una falla de red temporal al consultar `/metadata`, **When** ocurre el error, **Then** el cliente reintenta con backoff exponencial sin degradar el resto de la interfaz.

---

### User Story 3 - Empaquetado ligero en contenedor Nginx y flujo de CI (Priority: P3)

Como responsable de despliegue o desarrollador, dispongo de un contenedor Docker multi-stage optimizado que compila los estáticos con Vite y los sirve con Nginx Alpine (< 40 MB), con soporte de enrutamiento SPA, compresión gzip, cabeceras de seguridad y endpoint `/healthz`, junto con la automatización de validación en GitHub Actions.

**Why this priority**: Garantiza el Principio V de la Constitución ("Liviano y de alto rendimiento") y el ciclo de integración continua con verificaciones de lint, tipado y pruebas antes de cualquier despliegue.

**Independent Test**: Ejecutar la construcción del contenedor Docker, verificar que el tamaño final de la imagen sea inferior a 40 MB, levantar el contenedor y comprobar que `GET /healthz` retorne 200 OK y que rutas directas resuelvan a `index.html`.

**Acceptance Scenarios**:

1. **Given** el Dockerfile del proyecto, **When** se ejecuta el build multi-stage, **Then** la imagen resultante pesa menos de 40 MB.
2. **Given** el contenedor ejecutándose en el puerto 80, **When** se realiza una petición a `/healthz`, **Then** devuelve código HTTP 200 y cuerpo "ok".
3. **Given** el pipeline de GitHub Actions (`build-push.yml`), **When** se ejecuta un push o PR, **Then** se validan secuencialmente `lint`, `typecheck` y `test`.

---

### Edge Cases

- **Falla total de conexión con la API:** La interfaz debe presentar un banner informativo no bloqueante en el pie de página indicando el estado sin conexión y reintentar periódicamente sin generar errores no controlados en la consola.
- **Resoluciones atípicas o pantallas ultra-anchas (> 2560 px):** El contenedor principal debe respetar un ancho máximo centralizado (`max-w-7xl` o similar) para no dispersar excesivamente los paneles.
- **Móviles de pantalla muy pequeña (≤ 360 px):** Los textos y botones del encabezado deben envolverse ordenadamente sin desbordar horizontalmente la pantalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE estructurar la pantalla principal en dos paneles responsivos: panel izquierdo (40% en escritorio) para controles de zona y mapa; panel derecho (60% en escritorio) para anomalía y calendario, reorganizándose en columna única en pantallas móviles (< 768 px).
- **FR-002**: El sistema DEBE soportar internacionalización bilingüe (Español como predeterminado, Inglés alternativo) para todas las cadenas de texto del layout, encabezado y pie.
- **FR-003**: El sistema DEBE configurar el proveedor global de TanStack Query para orquestar llamadas asíncronas, caché de consultas y reintentos.
- **FR-004**: El sistema DEBE consultar el endpoint `/metadata` al inicializar la aplicación y reflejar `data_version` y fuentes satelitales/cartográficas en el pie de página.
- **FR-005**: El sistema DEBE emplear estados de carga basados en esqueletos discretos en lugar de spinners bloqueantes.
- **FR-006**: El sistema DEBE incluir un Dockerfile multi-stage (Node Alpine para compilación + Nginx Alpine sin privilegios para runtime) con comprobación de estado `/healthz` y tamaño total inferior a 40 MB.
- **FR-007**: El sistema DEBE incluir la configuración de Nginx con redirección SPA (`try_files $uri /index.html;`), compresión gzip y cabeceras de seguridad.
- **FR-008**: El sistema DEBE proveer configuración de CI en `.github/workflows/` que ejecute comprobaciones de lint, tipos TypeScript y pruebas unitarias.

### Key Entities

- **Metadata**: Registro de metadatos de la API que incluye `schema_version`, `data_version`, `factores_version`, `fecha_min`, `fecha_max`, `fecha_ultimo_sp`, referencias de satélites y listado de fuentes.
- **AppState**: Estado global y de contexto del frontend que gestiona el idioma activo (`'es' | 'en'`) y el estado de conectividad/red.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El layout principal renderiza completamente en el navegador en menos de 1 segundo en conexiones de velocidad media.
- **SC-002**: La alternancia entre Español e Inglés se efectúa de manera instantánea (< 50 ms) y sin parpadeos de interfaz.
- **SC-003**: El tamaño de la imagen final del contenedor Docker de producción es estrictamente inferior a 40 MB.
- **SC-004**: Cero errores en comprobaciones de accesibilidad (axe-core) sobre el esqueleto y contraste de texto ≥ 4.5:1 en todas las etiquetas del layout.
- **SC-005**: El pipeline de CI ejecuta las etapas de linting, typecheck y pruebas unitarias en menos de 3 minutos.

## Assumptions

- Se utiliza Vite como empaquetador ultrarrápido y estándar de la industria para aplicaciones React + TypeScript.
- La API backend estará disponible en la ruta relativa `/api/v1` en producción (orquestada por Traefik en el mismo dominio) o configurable mediante la variable de entorno `VITE_API_BASE_URL`.
- La paleta inicial y tokens de diseño respetan las pautas de accesibilidad definidas en `docs/04-diseno-visual-y-accesibilidad.md`.
