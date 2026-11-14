# 07 · Trabajo con GitHub Spec Kit (Spec-Driven Development)

## 1. Instalación e inicialización

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh                      # si no tienen uv
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z   # último tag
cd FireHistoryInterface
specify init --here --integration claude                             # o --ai claude en versiones anteriores
```

Se commitea `.specify/` y los archivos de comandos del agente.

## 2. Flujo

| Paso | Comando | Entrada |
|---|---|---|
| 1 | `/speckit.constitution` | §3 |
| 2 | `/speckit.specify` | Una feature de la §4 por vez |
| 3 | `/speckit.plan` | "Stack y contratos de docs/01–05; tipos desde el openapi de la API" |
| 4 | `/speckit.tasks` | — |
| 5 | `/speckit.implement` | — |

**Regla:** `docs/02` (pantallas) y `docs/03` (consumo de API) son la fuente de verdad. El contrato de la API vive en el repo `FireHistoryInterfaceAPI`.

## 3. Texto para `/speckit.constitution`

> Principios de FireHistoryInterface:
> 1. **Claridad para no especialistas:** textos simples, sin jerga; todo dato estimado se dice con palabras, textura y rango.
> 2. **Honestidad del dato:** "sin dato" nunca se muestra como 0; siempre se ven las fuentes y la `data_version`.
> 3. **Accesible por defecto:** WCAG 2.1 AA, navegación por teclado, tabla alternativa al calendario y paleta validada para daltonismo.
> 4. **Contrato de la API como fuente de verdad:** tipos generados desde `openapi.json`; nada de lógica de armonización en el frontend.
> 5. **Liviano:** sin librerías pesadas innecesarias; imagen final en Nginx < 40 MB.
> 6. **Estado compartible:** zona, período y capa en la URL.
> 7. **Probado:** casos F1–F10 automatizados en CI.

## 4. Features para `/speckit.specify` (en orden)

| # | Feature | Texto inicial |
|---|---|---|
| W1 | Esqueleto | "Crear la app React + TypeScript + Vite con i18n (es/en), TanStack Query, layout de docs/02 §1, pie con /metadata, Dockerfile y Nginx de docs/05 y CI." |
| W2 | Selector de zona y mapa | "Implementar ZoneSelector (provincia, rectángulo, polígono con Terra Draw, lat/lon con radio) y MapView con MapLibre, con estado en la URL (docs/02 §6)." |
| W3 | Calendario | "Implementar CalendarHeatmap según docs/02 §3 y docs/04, consumiendo /calendario (GET o POST según la zona) con estados de docs/02 §5 y tabla alternativa accesible." |
| W4 | Anomalía y serie | "Implementar AnomalyCard (docs/02 §4) y SeriesChart con banda de rango y granularidad mes/año." |
| W5 | Descargas | "Implementar DownloadButtons para calendario.csv y focos.csv con manejo de 413." |
| W6 | Capas del mapa | "Celdas del período (/mapa/celdas con debounce y manejo de 413) y capa de fuentes industriales." |
| W7 | Método | "MethodDialog con la explicación simple del método (antes de 2012 = estimado, rango, fuentes)." |
