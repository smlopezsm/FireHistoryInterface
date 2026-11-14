# 01 · Producto

## 1. Qué pide el desafío (texto oficial, resumido)

| Pedido de NASA | Tipo | Cómo lo resolvemos |
|---|---|---|
| Aplicación web con un **calendario de actividad de quema** basado en **focos activos** | Obligatorio | Pantalla principal: calendario mes × año |
| Armonizar MODIS y VIIRS para que **el sensor de origen deje de importar** | Obligatorio | La API devuelve conteos en escala VIIRS (S-NPP) |
| Elegir **región** y **rango de fechas** | Obligatorio | Selector de provincia, rectángulo o polígono dibujado + selector de período |
| Ver **qué meses y años** tuvieron más actividad | Obligatorio | Calendario con escala de color + resumen |
| Comparar el **mes actual con la mediana histórica** | Sugerido | Tarjeta de anomalía |
| **CSV descargable** de los focos de la búsqueda | Sugerido | Botones de descarga |
| Mapa para **dibujar el área** o ingresar lat/lon | Sugerido | Herramienta de dibujo + campo de coordenadas |
| Escalas de color **accesibles** | Sugerido | Paleta validada para daltonismo (docs/04) |

## 2. Usuarios

| Usuario | Qué necesita | Qué le damos |
|---|---|---|
| Brigadista / emergencias | Saber si este mes viene peor que lo normal en su zona | Tarjeta de anomalía, en lenguaje claro |
| Administrador de tierras / áreas protegidas | Ver qué temporada concentra el fuego y si hay tendencia | Calendario + serie anual |
| Científico / técnico | Datos para analizar | Descargas CSV con fuentes y versión |
| Público general | Entender qué pasó en su provincia | Lectura simple, sin jerga, con avisos de "estimado" |

## 3. Funcionalidades priorizadas

| Prioridad | Funcionalidad |
|---|---|
| **P0 (MVP)** | Selector de zona (provincia y polígono), período, calendario armonizado, aviso observado/estimado, descarga CSV del calendario |
| **P1** | Tarjeta de anomalía, serie anual/mensual, mapa de celdas del período, descarga CSV de focos, cambio de capa (armonizado / MODIS / VIIRS) |
| **P2** | Capa de fuentes industriales, ingreso de coordenadas lat/lon, idioma inglés, compartir por URL |
| **P3** | Contexto climático (NASA POWER), modo oscuro |

## 4. Reglas de producto (no negociables)

1. **Antes de 2012 todo es estimado** y debe verse distinto (rayado) y decirlo en texto.
2. **Nunca mostrar "0" cuando no hay dato**: se muestra "sin dato".
3. **Los rangos se muestran** cuando el valor es estimado.
4. **Fuentes y versión de datos visibles** en el pie de página (`data_version`).
5. **Textos sin jerga técnica**: "focos de calor detectados por satélite", no "anomalías térmicas VIIRS I-band".
