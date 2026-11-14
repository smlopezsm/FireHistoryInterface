export namespace GeoJSON {
  export type Position = number[];
  export type BBox = [number, number, number, number] | [number, number, number, number, number, number];
  export interface Geometry {
    type: string;
    coordinates?: unknown;
  }
  export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: number[][][];
  }
  export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  }
}

export type Capa = 'armonizado' | 'modis' | 'viirs';
export type Estado = 'observado' | 'estimado' | 'mixto';
export type Confianza = 'alta' | 'media' | 'baja';

export type Zona =
  | { tipo: 'provincia'; provincia_id: string }
  | { tipo: 'bbox'; bbox: [number, number, number, number] } // oeste, sur, este, norte
  | { tipo: 'geometria'; geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon };

export interface Provincia {
  provincia_id: string;
  nombre: string;
  region: string;
  bbox: [number, number, number, number];
  geometria?: GeoJSON.Geometry | null;
}

export interface MesArmonizado {
  periodo: string; // 'YYYY-MM' (o 'YYYY' en serie anual)
  modis: number;
  viirs: number | null; // null = no había VIIRS (≠ 0)
  armonizado: number;
  minimo: number;
  maximo: number;
  estado: Estado;
  frac_estimada: number; // 0–1
  confianza: Confianza;
  parcial?: boolean; // mes en curso
}

export interface CalendarioResponse {
  zona: {
    tipo: string;
    id?: string;
    bbox?: number[];
    celdas: number;
    area_km2: number;
  };
  capa: Capa;
  unidad: string;
  meses: MesArmonizado[];
  resumen: {
    max_mes: string;
    max_anio: number;
    total: number;
    mediana_mensual: number;
  };
  data_version: string;
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
  mediana: number;
  p25: number;
  p75: number;
  razon: number | null;
  percentil: number;
  categoria: CategoriaAnomalia | null;
  anios_usados: number;
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
}

export interface ApiError {
  error: {
    codigo: string;
    mensaje: string;
    detalle: unknown;
  };
}
