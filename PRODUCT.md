# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, MapLibre GL JS (mapa base), Terra Draw (herramienta de dibujo), TanStack Query (caché y gestión de datos remotos), Nginx Alpine (contenedor para distribución de estáticos).

## Users

- **Brigadistas y personal de emergencias:** necesitan evaluar rápidamente si el mes en curso presenta una actividad anómala ("peor que lo normal") en su zona de jurisdicción para coordinar recursos y alertas tempranas.
- **Administradores de tierras y áreas protegidas:** necesitan identificar qué temporada del año concentra el riesgo de incendios y analizar tendencias interanuales en sus zonas.
- **Científicos, técnicos y analistas ambientales:** requieren datos cuantitativos rigurosos, series históricas, desglose por sensor, intervalos de confianza para datos estimados y exportación en CSV con trazabilidad de fuentes y versiones.
- **Público general y periodistas:** buscan entender qué sucedió en su provincia o región a través de visualizaciones intuitivas, en lenguaje claro y sin jerga técnica satelital.

## Product Purpose

Proveer una interfaz web interactiva para consultar y descargar el **calendario armonizado de focos de calor detectados por satélite en Argentina (2000 hasta hoy)**, combinando los sensores MODIS y VIIRS en una única escala comparable (equivalente a VIIRS S-NPP), como respuesta al desafío *Harmonization of MODIS and VIIRS Hot Spots* del NASA Space Apps Challenge 2026. El producto permite seleccionar cualquier región del país (por provincia, coordenadas o dibujando polígonos), visualizar qué meses y años tuvieron mayor actividad de fuego, contrastar el mes actual con la mediana histórica (anomalía) y descargar los datos tabulares.

## Positioning

A diferencia de portales satelitales convencionales que presentan datos crudos desarticulados o superponen sensores con resoluciones dispares sin normalización, FireHistoryInterface armoniza de extremo a extremo MODIS y VIIRS en una sola serie unificada, transparentando rigurosamente la incertidumbre (el período 2000-2012, previo a VIIRS, se comunica como estimado con rangos e intervalos de predicción explícitos y textura visual diferenciada, nunca como dato exacto ni enmascarado).

## Operating Context

- Aplicación web responsive accesible desde navegadores de escritorio (panel doble: mapa 40% a la izquierda, visualizaciones analíticas 60% a la derecha) y dispositivos móviles (flujo vertical optimizado).
- Consumo directo de la API backend `FireHistoryInterfaceAPI` (FastAPI) desplegada en el mismo dominio o en entorno local (`/api/v1`).
- Entornos de uso en terreno o guardias con conectividad variable, donde la URL retiene el estado completo (zona, período y capa) para compartir consultas exactas de forma instantánea.

## Capabilities and Constraints

- **Selección espacial:** Selector de provincia oficial (IGN), ingreso manual de coordenadas/bounding box y herramienta de dibujo interactivo de polígonos libres sobre MapLibre.
- **Visualización temporal:** Calendario mes × año en matriz de calor (años en filas, meses en columnas), tarjeta de anomalía mensual vs. mediana histórica y serie temporal gráfica.
- **Transparencia metodológica no negociable:**
  - Todo registro previo a 2012 es estimado (a partir de MODIS calibrado) y debe mostrarse visualmente con textura diagonal rayada a 45° y en texto explícito con rangos de confianza.
  - La ausencia de dato nunca se representa como "0"; se clasifica y visualiza explícitamente como "sin dato".
  - Lenguaje llano y accesible: se utiliza "focos de calor detectados por satélite" evitando terminología cruda ("anomalías térmicas VIIRS I-band").
  - Identificación visible de la versión de datos y metadatos de las fuentes satelitales en el pie de página (`data_version`).
- **Descargas:** Exportación directa a CSV del calendario de focos agregados y del detalle de eventos con control de volumen (manejo de códigos 413 si la zona es excesivamente amplia).
- **Internacionalización:** Soporte bilingüe para Español (idioma predeterminado) e Inglés.

## Brand Commitments

- **Nombre:** FireHistoryInterface (Calendario Armonizado de Focos de Calor - Argentina).
- **Tono de voz:** Preciso, científico pero accesible, directo, transparente respecto a la incertidumbre de los modelos de estimación.
- **Referencias y fuentes institucionales:** NASA FIRMS (sensores MODIS y VIIRS), Instituto Geográfico Nacional (IGN) para límites territoriales oficiales de la República Argentina.

## Evidence on Hand

- Especificaciones funcionales completas y contratos documentados en `docs/`:
  - `docs/01-producto.md` (requisitos NASA Space Apps, casos de uso y reglas inquebrantables).
  - `docs/02-pantallas-y-componentes.md` (arquitectura de componentes, estados de carga y manejo de URL).
  - `docs/03-consumo-de-api.md` (contratos TypeScript, endpoints y especificación OpenAPI).
  - `docs/04-diseno-visual-y-accesibilidad.md` (paleta validada para daltonismo, codificación de datos por textura y contraste).
  - `docs/05-despliegue.md`, `docs/06-pruebas-y-aceptacion.md`, `docs/07-spec-kit.md`.
- Contrato OpenAPI de la API backend en repositorio complementario `FireHistoryInterfaceAPI`.

## Product Principles

1. **Claridad para no especialistas:** Textos comprensibles sin jerga; todo dato modelado/estimado se transparenta con textura visual, palabras y rango de incertidumbre.
2. **Honestidad del dato:** La falta de medición jamás se reporta como "0"; la versión de datos (`data_version`) y las fuentes permanecen siempre visibles.
3. **Equilibrio operativo y analítico:** La interfaz ofrece tanto diagnóstico inmediato (tarjeta de anomalía para brigadistas) como profundidad analítica (calendario histórico y descarga de series).
4. **Accesibilidad e inclusión por diseño:** Cumplimiento estricto de WCAG 2.1 AA, paletas probadas contra daltonismo, navegación integral por teclado y tablas accesibles alternativas para datos matriciales.
5. **Estado compartible y trazable:** Toda consulta (zona, período temporal y capa) se refleja de forma bidireccional en la URL.

## Accessibility & Inclusion

- Estándar objetivo: WCAG 2.1 AA.
- Contraste de texto ≥ 4.5:1 sobre todas las superficies.
- Paleta secuencial y divergente validada para daltonismo (protanopía, deuteranopía, tritanopía).
- La condición de "dato estimado" nunca se comunica exclusivamente por color: siempre utiliza textura rayada a 45°, descripción textual en tooltips y leyenda visible.
- Navegación íntegra por teclado (Tab, flechas en matriz de calendario y foco visible).
- Tabla alternativa en formato tabular accesible para lectores de pantalla (`aria-label` detallado por celda con valor, sensor y rango).
- Respeto de preferencias de usuario de movimiento reducido (`prefers-reduced-motion`).
