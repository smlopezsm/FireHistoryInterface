# 02 · Pantallas y componentes

## 1. Estructura de la pantalla principal (escritorio ≥ 1024 px)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Encabezado: título · selector de idioma · "¿Cómo se calcula?"            │
├──────────────────────────────┬───────────────────────────────────────────┤
│ PANEL IZQUIERDO (40 %)       │ PANEL DERECHO (60 %)                      │
│ ┌──────────────────────────┐ │ ┌───────────────────────────────────────┐ │
│ │ Selector de zona         │ │ │ Tarjeta de anomalía (mes actual)      │ │
│ │ [Provincia ▼] [Dibujar]  │ │ └───────────────────────────────────────┘ │
│ │ [Rectángulo] [Lat/Lon]   │ │ ┌───────────────────────────────────────┐ │
│ ├──────────────────────────┤ │ │ CALENDARIO mes × año (2000 → hoy)     │ │
│ │ MAPA (MapLibre)          │ │ │ filas = años · columnas = meses       │ │
│ │ zona + celdas del período│ │ │ rayado = estimado                     │ │
│ └──────────────────────────┘ │ └───────────────────────────────────────┘ │
│ Período: [desde] → [hasta]   │ ┌───────────────────────────────────────┐ │
│ Capa: (●) Armonizado         │ │ Serie (anual / mensual)               │ │
│       ( ) MODIS ( ) VIIRS    │ └───────────────────────────────────────┘ │
│ [Descargar calendario CSV]   │                                           │
│ [Descargar focos CSV]        │                                           │
├──────────────────────────────┴───────────────────────────────────────────┤
│ Pie: Fuentes NASA FIRMS · IGN · Versión de datos · Método (link)         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Móvil (< 768 px):** una sola columna en este orden: zona → anomalía → calendario → mapa → serie → descargas.

## 2. Componentes

| Componente | Responsabilidad | Endpoint | Props / entradas | Estado local |
|---|---|---|---|---|
| `ZoneSelector` | Elegir provincia, rectángulo, polígono o punto + radio | `/provincias` | `value: Zona`, `onChange` | Modo de selección |
| `MapView` | Mapa base, zona elegida, celdas con actividad, industriales | `/mapa/celdas`, `/mapa/industriales` | `zona`, `periodo`, `capa` | Vista (bbox), capas visibles |
| `DrawTool` | Dibujar o editar polígonos y rectángulos (Terra Draw) | — | `onFinish(geojson)` | Geometría en edición |
| `PeriodPicker` | Elegir el período (mes/año) con atajos: "últimos 12 meses", "toda la serie" | `/metadata` (límites) | `value`, `onChange` | — |
| `LayerToggle` | Armonizado / MODIS / VIIRS | — | `value`, `onChange` | — |
| `AnomalyCard` | "Este mes vs. lo normal" | `/anomalia` | `zona`, `mes` | — |
| `CalendarHeatmap` | Matriz mes × año con color y rayado | `/calendario` | `zona`, `periodo`, `capa` | Celda en foco (tooltip) |
| `SeriesChart` | Línea anual o mensual, con banda de rango | `/serie` | `zona`, `periodo`, `granularidad` | Granularidad |
| `DownloadButtons` | Descargas CSV | `/descargas/*.csv` | `zona`, `periodo` | Descargando o no |
| `MethodDialog` | Explicación simple del método | — | — | Abierto o cerrado |
| `DataFooter` | Fuentes y `data_version` | `/metadata` | — | — |

## 3. Detalle: `CalendarHeatmap`

| Elemento | Especificación |
|---|---|
| Filas | Años (más reciente arriba) |
| Columnas | Ene … Dic |
| Color de celda | Escala **secuencial** de un solo tono según `armonizado` (docs/04) |
| Celdas estimadas | Rayado diagonal a 45° sobre el color, más el texto "estimado" en el tooltip |
| Celdas `mixto` | Rayado más espaciado |
| Sin dato (antes de 2000-11 o mes futuro) | Gris neutro sin rayado, texto "sin dato" |
| Mes en curso | Borde punteado + "parcial" |
| Tooltip | `Agosto 2006 · 359 focos (estimado; entre 262 y 445) · MODIS: 120 · VIIRS: sin dato · Confianza: media` |
| Leyenda | Barra de la escala + muestras de "estimado" y "sin dato" |
| Resumen arriba | "Mes con más focos: Agosto 2020 · Año con más focos: 2020" |
| Teclado | Flechas para moverse entre celdas; Enter abre el detalle |
| Tabla alternativa | Botón "Ver como tabla" (accesibilidad) |

## 4. Detalle: `AnomalyCard`

| `categoria` (API) | Texto | Ícono | Color |
|---|---|---|---|
| `muy_por_encima` | "Mucho más fuego que lo normal para {mes}" | ▲▲ | Polo cálido de la escala divergente |
| `por_encima` | "Más fuego que lo normal" | ▲ | Cálido suave |
| `normal` | "Dentro de lo normal" | ● | Gris neutro |
| `por_debajo` | "Menos fuego que lo normal" | ▼ | Frío suave |
| `muy_por_debajo` | "Mucho menos fuego que lo normal" | ▼▼ | Polo frío |
| `null` | "No hay suficientes años para comparar" | — | Gris |

**Línea secundaria:** "{valor} focos · lo normal: {mediana} ({p25}–{p75})".

## 5. Estados de la interfaz

| Estado | Qué se muestra |
|---|---|
| Inicial | Argentina completa preseleccionada, toda la serie |
| Cargando | Esqueletos grises con la forma del componente (sin spinners bloqueantes) |
| Vacío | "No se detectaron focos en esta zona y período" |
| Error 400/413 | Mensaje de la API traducido + sugerencia ("achicá la zona") |
| Error 503/504 | "Los datos se están actualizando. Probá en unos minutos." + reintento |
| Sin conexión | Aviso persistente y reintento automático |

## 6. Estado en la URL

| Parámetro | Ejemplo | Descripción |
|---|---|---|
| `zona` | `prov:74`, `bbox:-67.4,-36,-64.9,-31.8`, `geo:<id>` | Zona (los polígonos se guardan comprimidos en `geo`) |
| `desde`, `hasta` | `2000-11`, `2026-10` | Período |
| `capa` | `armonizado` | Capa |
| `lang` | `es` | Idioma |

Ejemplo: `/?zona=prov:74&desde=2000-11&hasta=2026-10&capa=armonizado`.
