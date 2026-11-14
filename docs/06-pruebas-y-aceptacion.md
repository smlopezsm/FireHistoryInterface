# 06 · Pruebas y criterios de aceptación

## 1. Tipos de prueba

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarias | Vitest + Testing Library | Formateo de números, reglas de "estimado / sin dato", conversión de zona a parámetros, escala de colores |
| Componentes | Vitest + Testing Library + MSW (API simulada) | `CalendarHeatmap`, `AnomalyCard`, `ZoneSelector`, `DownloadButtons` con respuestas de ejemplo |
| Extremo a extremo | Playwright contra la API real en *staging* | Flujos principales |
| Accesibilidad | `axe-core` en Playwright | Sin violaciones serias o críticas |
| Rendimiento | Lighthouse CI | Desempeño ≥ 85 y accesibilidad ≥ 95 en escritorio |

## 2. Casos clave

| ID | Caso | Esperado |
|---|---|---|
| F1 | Calendario con un mes `viirs = null` | El tooltip dice "sin dato (VIIRS empezó en 2012)" |
| F2 | Mes `estado = estimado` | Celda rayada; tooltip con "≈" y rango |
| F3 | Mes `estado = mixto` | Rayado espaciado; tooltip con "% estimado" |
| F4 | Error 413 en el mapa | Aviso "Acercá el mapa o acortá el período"; el resto sigue funcionando |
| F5 | Cambiar de provincia | Calendario, serie, anomalía y URL se actualizan |
| F6 | Dibujar un polígono | Se usa POST en los endpoints; la URL guarda la geometría |
| F7 | Anomalía `categoria = null` | Texto "No hay suficientes años para comparar" |
| F8 | Descargar calendario CSV | Se descarga un archivo con el nombre esperado |
| F9 | Recargar una URL compartida | Se restauran zona, período y capa |
| F10 | Sólo teclado | Se puede elegir provincia, recorrer el calendario y descargar |

## 3. Flujos extremo a extremo

1. **Brigadista:** entra → elige "San Luis" → lee la tarjeta de anomalía → abre el mes de mayor actividad.
2. **Técnico:** dibuja un polígono → período 2018–2024 → descarga focos CSV.
3. **Público general:** abre "¿Cómo se calcula?" → entiende "estimado antes de 2012".

## 4. Criterios de aceptación del MVP

- [ ] Las funcionalidades P0 de [01](01-producto.md) están completas.
- [ ] F1–F10 pasan en CI.
- [ ] Sin violaciones de accesibilidad serias o críticas.
- [ ] Imagen < 40 MB; despliegue por webhook en menos de 1 minuto.
- [ ] Funciona en Chrome, Firefox y Safari actuales, y en móvil (≥ 360 px de ancho).
- [ ] Fuentes y `data_version` visibles en todas las pantallas.
