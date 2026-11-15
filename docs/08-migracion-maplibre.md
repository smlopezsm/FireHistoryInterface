# Migración del Globo 3D de Mapbox GL JS a MapLibre GL JS

- **Rama:** `feat/maplibre-globe-denis-pablo`
- **Componente principal:** `src/features/globe/GloboTerraqueo.tsx`

## Qué cambió

1. **Dependencia libre sin token:** Se reemplazó `mapbox-gl` y `@types/mapbox-gl` por `maplibre-gl` (`^6.18.0`), eliminando `VITE_MAPBOX_ACCESS_TOKEN`, el modal de ingreso de token y los chunks/stubs de Mapbox en `vite.config.ts` y `tests/setup.ts`.
2. **Proyección 3D, atmósfera y mapa base IGN:** Se configuró `DEFAULT_GLOBE_STYLE` con `projection: { type: 'globe' }`, atmósfera espacial (`sky`) y teselas TMS públicas de **IGN Argentina (`argenmap_oscuro`)** (`scheme: 'tms'`), manteniendo soporte opcional de override por `VITE_MAP_STYLE_URL`.
3. **Animación orbital y puntos calientes:** Se conservó la rotación orbital (`spinGlobe`), la leyenda de detecciones térmicas (MODIS 1 km / VIIRS 375 m / alta intensidad) y los marcadores con pulso (`animate-ping`) consumiendo `/api/v1/mapa/celdas` sin bucle de re-renderizado.
