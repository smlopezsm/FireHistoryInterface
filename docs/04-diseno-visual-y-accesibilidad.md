# 04 · Diseño visual y accesibilidad

## 1. Codificación de los datos

| Qué se muestra | Tipo de escala | Regla |
|---|---|---|
| Cantidad de focos (calendario, celdas del mapa) | **Secuencial**, un solo tono (claro → oscuro) | Más oscuro = más focos; escala logarítmica o por cuantiles (los meses de mucho fuego son 100× los tranquilos) |
| Anomalía (vs. lo normal) | **Divergente**: dos tonos con gris neutro en el centro | Frío = menos que lo normal; cálido = más; gris = normal |
| Observado vs. estimado | **Textura**, no color | Rayado diagonal a 45° = estimado; sin rayado = observado |
| Sin dato | Gris neutro liso | Nunca el color del "cero" |
| Fuentes industriales (mapa) | Ícono ⚙︎ en gris oscuro | No se confunde con fuego |

> **Regla:** "estimado" nunca se comunica **solo** con color. Siempre lleva textura + texto en el tooltip + leyenda.

## 2. Paleta de referencia (validada para daltonismo)

| Rol | Valores |
|---|---|
| Secuencial (focos), 7 pasos | `#cde2fb` · `#9ec5f4` · `#6da7ec` · `#3987e5` · `#256abf` · `#184f95` · `#0d366b` |
| Divergente frío (menos fuego) | `#2a78d6` |
| Divergente cálido (más fuego) | `#eb6834` |
| Neutro (normal / sin dato) | `#d9d8d3` |
| Superficie clara | `#fcfcfb` |
| Texto principal / secundario | `#1f1f1d` / `#55554f` |

- Antes de publicar, la paleta final se valida con un chequeo automático de daltonismo (diferencias entre tonos vecinos) y de contraste.
- El calendario **siempre** tiene leyenda.

## 3. Calendario: decisiones de diseño

| Decisión | Motivo |
|---|---|
| Años en filas y meses en columnas | Se leen las **temporadas** (columnas) y los **años malos** (filas) |
| Escala por cuantiles de toda la serie de la zona | Evita que un año extremo (por ejemplo 2020) deje todo lo demás en blanco |
| Valor visible al pasar el mouse o con el foco del teclado | Sin números en cada celda (ruido) |
| Separación de 2 px entre celdas | Lectura limpia |
| Marca en el mes de mayor actividad | Responde al pedido del desafío ("qué mes tuvo más fuego") |

## 4. Accesibilidad (objetivo: WCAG 2.1 AA)

| Requisito | Implementación |
|---|---|
| Contraste de texto | ≥ 4,5:1 |
| Teclado | Todo es navegable con Tab y flechas; foco visible |
| Lectores de pantalla | `aria-label` por celda del calendario ("Agosto 2006, 359 focos estimados") y vista de tabla alternativa |
| Daltonismo | Paleta validada + textura para "estimado" |
| Movimiento | Respeta `prefers-reduced-motion` |
| Idioma | `lang` del documento según el idioma activo |
| Mapa | Toda la información del mapa también está en el calendario o en la serie (el mapa no es la única vía) |

## 5. Textos clave (español)

| Lugar | Texto |
|---|---|
| Subtítulo | "Focos de calor detectados por satélite en Argentina, de 2000 a hoy, en una misma escala." |
| Aviso de método | "Antes de 2012 solo existía el satélite MODIS. Esos meses son **estimaciones** de lo que habría visto VIIRS, con su rango." |
| Leyenda de rayado | "Estimado a partir de MODIS" |
| Pie | "Datos: NASA FIRMS (MODIS y VIIRS). Límites: IGN. Versión de datos: {data_version}." |
