// Tipos del contrato de FireHistoryInterfaceAPI (/api/v1).
// Fuente: docs de la API y /openapi.json. No agregar campos que la API no devuelve.

export namespace GeoJSON {
  export type Position = number[];
  export type BBox = [number, number, number, number] | [number, number, number, number, number, number];
  export interface Geometry {
    type: string;
    coordinates?: unknown;
  }
  export interface Point extends Geometry {
    type: 'Point';
    coordinates: number[];
  }
  export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: number[][][];
  }
  export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  }
  export interface Feature<G = Geometry, P = Record<string, unknown>> {
    type: 'Feature';
    geometry: G;
    properties: P;
  }
  export interface FeatureCollection<G = Geometry, P = Record<string, unknown>> {
    type: 'FeatureCollection';
    features: Feature<G, P>[];
  }
}

export type Capa = 'armonizado' | 'modis' | 'viirs';
export type Estado = 'observado' | 'estimado' | 'mixto';
export type Confianza = 'alta' | 'media' | 'baja';
export type Granularidad = 'mes' | 'anio';
export type Sensor = 'todos' | 'MODIS' | 'VIIRS';
export type BBox = [number, number, number, number]; // oeste, sur, este, norte

/** Zona de consulta: exactamente una. `geometria` solo viaja por POST. */
export type PedidoZona =
  | { provincia_id: string }
  | { region: string }
  | { bbox: string }
  | { geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon };

/** Zona tal como la describe la respuesta. */
export interface Zona {
  tipo: 'provincia' | 'region' | 'bbox' | 'geometria';
  id: string | null;
  bbox: BBox | null;
  celdas: number;
  area_km2: number;
}

export interface Provincia {
  provincia_id: string;
  nombre: string;
  region: string;
  bbox: BBox;
  geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
}

/** Un mes (o año en serie anual). `viirs` null = no había VIIRS (≠ 0). */
export interface Punto {
  periodo: string; // 'YYYY-MM' o 'YYYY'
  modis: number;
  viirs: number | null;
  armonizado: number;
  minimo: number;
  maximo: number;
  estado: Estado;
  frac_estimada: number; // 0–1
  dias_sin_modis?: number;
  confianza: Confianza;
  parcial: boolean; // mes en curso
}

/** @deprecated usar Punto */
export type MesArmonizado = Punto;

export interface CalendarioResponse {
  zona: Zona;
  capa: Capa;
  unidad: string;
  meses: Punto[];
  resumen: {
    max_mes: string | null;
    max_anio: number | null;
    total: number | null;
    mediana_mensual: number | null;
  };
  data_version: string;
}

export interface SerieResponse {
  zona: Zona;
  granularidad: Granularidad;
  puntos: Punto[];
}

export type CategoriaAnomalia =
  | 'muy_por_debajo'
  | 'por_debajo'
  | 'normal'
  | 'por_encima'
  | 'muy_por_encima';

export interface AnomaliaResponse {
  mes: string;
  valor: number;
  referencia?: 'observada' | 'estimada';
  mediana: number | null;
  p25: number | null;
  p75: number | null;
  razon: number | null;
  percentil: number | null;
  categoria: CategoriaAnomalia | null;
  anios_usados: number;
}

export interface HealthResponse {
  estado: 'ok' | 'degradado';
  datos_listos: boolean;
  data_version: string | null;
  fecha_max: string | null;
}

export interface Metadata {
  schema_version: string;
  data_version: string;
  factores_version: string;
  fecha_min: string;
  fecha_max: string;
  fecha_ultimo_sp: string;
  referencia_viirs: {
    satelite: string;
    desde: string;
    hasta: string | null;
  }[];
  fuentes: string[];
  pipeline_commit?: string;
  celdas_total?: number;
  provincias_total?: number;
}

export interface CeldaProps {
  cell_id: number;
  provincia_id: string | null;
  modis: number;
  viirs: number | null;
  estado: Estado;
  valor: number;
}
export type MapaCeldas = GeoJSON.FeatureCollection<GeoJSON.Polygon, CeldaProps>;

export interface IndustrialProps {
  motivo: string;
  n_focos: number;
  provincia_id: string | null;
}
export type MapaIndustriales = GeoJSON.FeatureCollection<GeoJSON.Point, IndustrialProps>;

export interface ApiError {
  error: {
    codigo: string;
    mensaje: string;
    detalle: unknown;
  };
}
