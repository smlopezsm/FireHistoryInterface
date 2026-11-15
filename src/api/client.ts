import type {
  ApiError,
  Metadata,
  HealthResponse,
  Provincia,
  CalendarioResponse,
  AnomaliaResponse,
  Capa,
  GeoJSON,
} from './types';

const resolveApiBaseUrl = (): string => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  // Si se especificó VITE_API_BASE_URL, es la prioridad principal
  const rawUrl = (apiBaseUrl || backendUrl || '/api/v1').trim();
  const cleanUrl = rawUrl.replace(/\/+$/, '');

  // Si ya tiene el prefijo de la API (/api/v1), respetarlo
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }

  // Si solo tiene /api, completar a /api/v1
  if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/v1`;
  }

  // Si se puso solo el host/puerto (ej: http://66.97.41.70:9000 o http://localhost:8000)
  return `${cleanUrl}/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiRequestError extends Error {
  codigo?: string;
  status: number;
  detalle?: unknown;

  constructor(mensaje: string, status: number, codigo?: string, detalle?: unknown) {
    super(mensaje);
    this.name = 'ApiRequestError';
    this.status = status;
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Body not JSON
    }

    const mensaje =
      errorData?.error?.mensaje ||
      `Error en petición a la API (${response.status}: ${response.statusText})`;
    const codigo = errorData?.error?.codigo;
    const detalle = errorData?.error?.detalle;

    throw new ApiRequestError(mensaje, response.status, codigo, detalle);
  }

  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health');
}

export async function getMetadata(): Promise<Metadata> {
  return fetchApi<Metadata>('/metadata');
}

export async function getProvincias(geometria: boolean = false): Promise<Provincia[]> {
  return fetchApi<Provincia[]>(`/provincias?geometria=${geometria}`);
}

export interface CalendarioParams {
  provincia_id?: string;
  bbox?: string;
  capa?: Capa;
  desde?: string;
  hasta?: string;
}

export async function getCalendario(params: CalendarioParams): Promise<CalendarioResponse> {
  const query = new URLSearchParams();
  if (params.provincia_id) {
    query.set('provincia_id', params.provincia_id);
  } else if (params.bbox) {
    query.set('bbox', params.bbox);
  }
  if (params.capa) query.set('capa', params.capa);
  if (params.desde) query.set('desde', params.desde);
  if (params.hasta) query.set('hasta', params.hasta);

  return fetchApi<CalendarioResponse>(`/calendario?${query.toString()}`);
}

export interface AnomaliaParams {
  provincia_id?: string;
  bbox?: string;
  mes?: string;
}

export async function getAnomalia(params: AnomaliaParams): Promise<AnomaliaResponse> {
  const query = new URLSearchParams();
  if (params.provincia_id) {
    query.set('provincia_id', params.provincia_id);
  } else if (params.bbox) {
    query.set('bbox', params.bbox);
  }
  if (params.mes) query.set('mes', params.mes);

  return fetchApi<AnomaliaResponse>(`/anomalia?${query.toString()}`);
}

export interface MapaCeldasParams {
  bbox: string;
  desde: string;
  hasta: string;
  capa?: Capa;
  min_focos?: number;
}

export async function getMapaCeldas(params: MapaCeldasParams): Promise<GeoJSON.FeatureCollection> {
  const query = new URLSearchParams();
  query.set('bbox', params.bbox);
  query.set('desde', params.desde);
  query.set('hasta', params.hasta);
  if (params.capa) query.set('capa', params.capa);
  if (params.min_focos !== undefined) query.set('min_focos', String(params.min_focos));

  return fetchApi<GeoJSON.FeatureCollection>(`/mapa/celdas?${query.toString()}`);
}

export function getCalendarioDownloadUrl(params: CalendarioParams): string {
  const query = new URLSearchParams();
  if (params.provincia_id) {
    query.set('provincia_id', params.provincia_id);
  } else if (params.bbox) {
    query.set('bbox', params.bbox);
  }
  if (params.capa) query.set('capa', params.capa);
  if (params.desde) query.set('desde', params.desde);
  if (params.hasta) query.set('hasta', params.hasta);

  return `${API_BASE_URL.replace(/\/$/, '')}/descargas/calendario.csv?${query.toString()}`;
}

export function getFocosDownloadUrl(params: {
  provincia_id?: string;
  bbox?: string;
  desde: string;
  hasta: string;
  sensor?: string;
}): string {
  const query = new URLSearchParams();
  if (params.provincia_id) {
    query.set('provincia_id', params.provincia_id);
  } else if (params.bbox) {
    query.set('bbox', params.bbox);
  }
  query.set('desde', params.desde);
  query.set('hasta', params.hasta);
  if (params.sensor) query.set('sensor', params.sensor);

  return `${API_BASE_URL.replace(/\/$/, '')}/descargas/focos.csv?${query.toString()}`;
}
