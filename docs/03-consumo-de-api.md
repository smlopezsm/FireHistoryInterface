# 03 · Consumo de la API

**Contrato completo:** `FireHistoryInterfaceAPI/docs/03-contratos-api.md`. Este documento define **qué usa el frontend y cómo**.

## 1. Configuración

| Variable (build) | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API. En producción es el mismo dominio (Traefik enruta `/api`), así que no hay problemas de CORS |
| `VITE_DEFAULT_LANG` | `es` | Idioma inicial |
| `VITE_MAP_STYLE_URL` | (estilo libre sin API key) | Estilo del mapa base |

## 2. Endpoints por componente

| Componente | Endpoint | Método | Cuándo se llama | Caché (TanStack Query) |
|---|---|---|---|---|
| `DataFooter`, `PeriodPicker` | `/metadata` | GET | Al cargar | `staleTime` 1 h |
| `ZoneSelector` | `/provincias?geometria=true` | GET | Al cargar | 24 h |
| `CalendarHeatmap` | `/calendario` | GET (provincia, bbox) / POST (polígono) | Cambia zona, período o capa | 1 h, clave = zona + período + capa |
| `SeriesChart` | `/serie` | GET / POST | Igual que el anterior + granularidad | 1 h |
| `AnomalyCard` | `/anomalia` | GET / POST | Cambia la zona | 1 h |
| `MapView` | `/mapa/celdas` | GET | Cambia la vista del mapa (con *debounce* de 400 ms) o el período | 10 min |
| `MapView` | `/mapa/industriales` | GET | Al activar la capa | 24 h |
| `DownloadButtons` | `/descargas/calendario.csv`, `/descargas/focos.csv` | GET / POST | Al hacer clic | Sin caché (descarga directa) |

**Zona "punto + radio" o "lat/lon":** el frontend genera un polígono circular de 64 vértices y lo manda como `geometria` (POST).

## 3. Tipos TypeScript (espejo del contrato)

```ts
export type Capa = 'armonizado' | 'modis' | 'viirs';
export type Estado = 'observado' | 'estimado' | 'mixto';
export type Confianza = 'alta' | 'media' | 'baja';

export type Zona =
  | { tipo: 'provincia'; provincia_id: string }
  | { tipo: 'bbox'; bbox: [number, number, number, number] }   // oeste, sur, este, norte
  | { tipo: 'geometria'; geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon };

export interface Provincia {
  provincia_id: string; nombre: string; region: string;
  bbox: [number, number, number, number]; geometria?: GeoJSON.Geometry | null;
}

export interface MesArmonizado {
  periodo: string;            // 'YYYY-MM' (o 'YYYY' en serie anual)
  modis: number;
  viirs: number | null;       // null = no había VIIRS (≠ 0)
  armonizado: number;
  minimo: number;
  maximo: number;
  estado: Estado;
  frac_estimada: number;      // 0–1
  confianza: Confianza;
  parcial?: boolean;          // mes en curso
}

export interface CalendarioResponse {
  zona: { tipo: string; id?: string; bbox?: number[]; celdas: number; area_km2: number };
  capa: Capa;
  unidad: string;
  meses: MesArmonizado[];
  resumen: { max_mes: string; max_anio: number; total: number; mediana_mensual: number };
  data_version: string;
}

export type CategoriaAnomalia =
  'muy_por_debajo' | 'por_debajo' | 'normal' | 'por_encima' | 'muy_por_encima';

export interface AnomaliaResponse {
  mes: string; valor: number; mediana: number; p25: number; p75: number;
  razon: number | null; percentil: number; categoria: CategoriaAnomalia | null; anios_usados: number;
}

export interface Metadata {
  schema_version: string; data_version: string; factores_version: string;
  fecha_min: string; fecha_max: string; fecha_ultimo_sp: string;
  referencia_viirs: { satelite: string; desde: string; hasta: string | null }[];
  fuentes: string[];
}

export interface ApiError { error: { codigo: string; mensaje: string; detalle: unknown } }
```

> Los tipos se generan automáticamente desde `/openapi.json` (por ejemplo, con `openapi-typescript`) en CI. Este bloque es la referencia para revisar.

## 4. Manejo de errores

| HTTP / `codigo` | Acción en la interfaz |
|---|---|
| 400 `ZONA_INVALIDA` / `GEOMETRIA_INVALIDA` | Marcar el selector de zona en error y mostrar el `mensaje` |
| 400 `PERIODO_INVALIDO` | Ajustar el período a `[fecha_min, fecha_max]` y avisar |
| 413 `RESULTADO_DEMASIADO_GRANDE` | Mapa: "Acercá el mapa o acortá el período". CSV: "Achicá la zona o el período" |
| 503 / 504 | Aviso no bloqueante + reintento con *backoff* (3 intentos) |
| Error de red | Aviso persistente "Sin conexión" |

## 5. Reglas de presentación de datos

| Dato | Regla |
|---|---|
| `viirs = null` | Mostrar "sin dato (VIIRS empezó en 2012)" |
| `estado = estimado` | Valor con "≈", rango entre paréntesis y rayado en el calendario |
| Números | Separador de miles según idioma; armonizados redondeados a entero en pantalla |
| `confianza = baja` | Ícono de advertencia y texto "estimación con poca información" |
| `data_version` | Siempre visible en el pie de página |
