<!--
Sync Impact Report
- Version change: initial-template → 1.0.0 (Initial Ratification)
- Core principles defined:
  1. I. Claridad para no especialistas
  2. II. Honestidad del dato
  3. III. Accesible por defecto (WCAG 2.1 AA)
  4. IV. Contrato de la API como fuente de verdad
  5. V. Liviano y de alto rendimiento
  6. VI. Estado compartible en la URL
  7. VII. Calidad verificada y automatizada (F1–F10)
- Added sections:
  - Reglas no negociables y restricciones técnicas
  - Flujo de desarrollo y Quality Gates
- Follow-up TODOs: none
-->

# FireHistoryInterface Constitution

## Core Principles

### I. Claridad para no especialistas
Textos comprensibles y directos sin jerga satelital o térmica. Todo dato estimado se explicita obligatoriamente mediante tres canales simultáneos: palabras claras ("estimado"), textura visual diferenciada (rayado diagonal a 45°) y rango de incertidumbre numérico explícito (min-max / intervalos). Nunca se utilizan términos como "anomalías térmicas VIIRS I-band" de cara al usuario final.

### II. Honestidad del dato
La ausencia de medición jamás se disfraza o confunde con el número cero ("0"); se reporta siempre de forma inequívoca como "sin dato". Las fuentes satelitales (NASA FIRMS MODIS y VIIRS), los límites territoriales oficiales (IGN) y la versión de los datos procesados (`data_version`) deben ser visibles permanentemente en el pie de página de la aplicación.

### III. Accesible por defecto (WCAG 2.1 AA)
La aplicación debe cumplir el estándar WCAG 2.1 AA desde su concepción. Toda funcionalidad es completamente operable mediante teclado, las paletas de color son analizadas y validadas contra daltonismo (protanopía, deuteranopía, tritanopía) con contraste mínimo de 4.5:1, y la información tabular del mapa y del calendario cuenta con una vista alternativa accesible para lectores de pantalla. Se respeta la preferencia de movimiento reducido (`prefers-reduced-motion`).

### IV. Contrato de la API como fuente de verdad
El frontend no contiene lógica de armonización de sensores ni cálculos geoespaciales pesados. Todos los tipos TypeScript se generan de forma estricta a partir del esquema OpenAPI oficial (`FireHistoryInterfaceAPI`). La API es la única autoridad de cálculo y el cliente web es un consumidor desacoplado y reactivo.

### V. Liviano y de alto rendimiento
No se incorporan dependencias pesadas innecesarias (prohibido empaquetar librerías masivas monolíticas como Plotly completo; se priorizan componentes modulares y ligeros). La imagen final de producción para Nginx Alpine debe pesar menos de 40 MB y cargar en el navegador con tiempos de respuesta instantáneos.

### VI. Estado compartible en la URL
La selección espacial (`zona`), el rango temporal (`desde`, `hasta`), la capa activa (`capa`) y el idioma (`lang`) residen de forma sincronizada y bidireccional en los parámetros de la URL. Cualquier consulta debe ser reproducible de forma exacta y compartible con solo copiar y pegar el enlace.

### VII. Calidad verificada y automatizada (F1–F10)
Todo flujo crítico del MVP está respaldado por pruebas automatizadas integradas en el pipeline de CI: desde pruebas unitarias de formateo y reglas de negocio, pruebas de componentes con API mockeada (MSW), hasta pruebas de integración y accesibilidad de los casos de aceptación F1–F10. Ningún cambio se despliega sin pasar las compuertas de calidad.

## Reglas no negociables y restricciones técnicas

1. **Período estimado:** Todo registro satelital anterior a 2012 (previo a VIIRS) es clasificado como estimado y requiere textura visual rayada a 45°, aviso en tooltip y especificación de rango.
2. **Semántica de nulos:** Un valor `viirs = null` significa "sin dato (VIIRS comenzó en 2012)", nunca cero.
3. **Manejo de códigos HTTP específicos:**
   - 400 (`ZONA_INVALIDA`, `PERIODO_INVALIDO`): Marcar el control correspondiente y guiar la corrección.
   - 413 (`RESULTADO_DEMASIADO_GRANDE`): Mostrar aviso claro sugiriendo reducir el área geográfica o acortar el intervalo de tiempo.
   - 503 / 504: Notificación no bloqueante con reintento automático y backoff exponencial (3 intentos).
4. **Tecnología base:** React + TypeScript + Vite, MapLibre GL JS, Terra Draw, TanStack Query, Tailwind CSS / tokens de diseño de docs/04, Nginx Alpine en Docker.

## Flujo de desarrollo y Quality Gates

1. **Spec-Driven Development (SDD):** El desarrollo de cada incremento se rige por el ciclo estricto de GitHub Spec Kit (`specify` → `plan` → `tasks` → `implement`).
2. **Integración Continua (CI):** Cada pull request a `main` debe ejecutar y aprobar sin advertencias:
   - `npm run lint` (ESLint)
   - `npm run typecheck` (tsc sin errores)
   - `npm test` (pruebas unitarias y de componentes)
   - Verificación de paridad de tipos con `openapi.json`
3. **Validación de Accesibilidad:** Chequeos automatizados con `axe-core` para garantizar ausencia de violaciones críticas o serias de WCAG 2.1 AA.
4. **Despliegue inmutable:** Construcción en contenedor Docker multi-stage, publicación de imagen en GitHub Container Registry (GHCR) y despliegue automático vía webhook hacia Dokploy.

## Governance

Esta Constitución representa la ley fundamental de desarrollo para `FireHistoryInterface` y prevalece sobre cualquier decisión arquitectónica o de código divergente. Toda modificación o enmienda a estos principios requiere:
1. Documentación explícita del motivo del cambio y su impacto.
2. Aprobación del equipo o líder técnico del proyecto.
3. Incremento formal de la versión del documento según versionado semántico:
   - **MAJOR:** Eliminación o cambio incompatible de un principio básico o regla no negociable.
   - **MINOR:** Adición de un nuevo principio, sección o directiva relevante.
   - **PATCH:** Correcciones tipográficas, aclaraciones de redacción o refinamientos no semánticos.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
