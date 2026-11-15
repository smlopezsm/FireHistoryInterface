import type {
  ApiError,
  Metadata,
  HealthResponse,
  Provincia,
  CalendarioResponse,
  SerieResponse,
  AnomaliaResponse,
  Capa,
  Granularidad,
  Sensor,
  PedidoZona,
  MapaCeldas,
  MapaIndustriales,
} from './types';

/**
 * Base de la API. En producción es SIEMPRE la ruta relativa `/api/v1`
 * (frontend y API comparten dominio). En desarrollo el proxy de Vite
 * (vite.config.ts, variable VITE_BACKEND_URL) redirige `/api` al backend.
 * VITE_API_BASE_URL queda solo como escape para casos especiales.
 */
const resolveApiBaseUrl = (): string => {
  const raw = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim().replace(/\/+$/, '');
  if (raw.endsWith('/api/v1')) return raw;
  if (raw.endsWith('/api')) return `${raw}/v1`;
  return `${raw}/api/v1`;
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

const buildUrl = (endpoint: string, query?: URLSearchParams) => {
  const base = `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
  const qs = query?.toString();
  return qs ? `${base}?${qs}` : base;
};

/** Convierte una respuesta no-ok en ApiRequestError con el mensaje de la API. */
async function toApiError(response: Response): Promise<ApiRequestError> {
  let errorData: ApiError | null = null;
  try {
    errorData = await response.json();
  } catch {
    // Body no JSON (por ejemplo, un proxy que devuelve HTML)
  }
  const mensaje =
    errorData?.error?.mensaje ||
    `Error en el pedido a la API (${response.status}${response.statusText ? `: ${response.statusText}` : ''})`;
  return new ApiRequestError(mensaje, response.status, errorData?.error?.codigo, errorData?.error?.detalle);
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  // En desarrollo el proxy puede cambiar de backend: revalidar siempre (ETag → 304)
  // para no mostrar respuestas viejas guardadas por Cache-Control: max-age=3600.
  const response = await fetch(url, import.meta.env.DEV ? { cache: 'no-cache', ...init } : init);
  if (!response.ok) throw await toApiError(response);
  return response;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await request(url, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  return response.json() as Promise<T>;
}

/** Compatibilidad: GET JSON a un endpoint relativo a la base. */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return requestJson<T>(buildUrl(endpoint), options);
}

type Params = Record<string, string | number | undefined | null>;

const toQuery = (params: Params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return q;
};

/**
 * Pedido con zona: GET con query para provincia/bbox, POST con body JSON
 * cuando hay un polígono dibujado (la API solo acepta `geometria` por POST).
 */
function zonaRequest(endpoint: string, zona: PedidoZona, params: Params, accept: string, signal?: AbortSignal) {
  if ('geometria' in zona) {
    const body: Record<string, unknown> = { geometria: zona.geometria };
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') body[k] = v;
    });
    return request(buildUrl(endpoint), {
      method: 'POST',
      headers: { Accept: accept, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  }
  return request(buildUrl(endpoint, toQuery({ ...zona, ...params })), {
    headers: { Accept: accept },
    signal,
  });
}

async function zonaJson<T>(endpoint: string, zona: PedidoZona, params: Params, signal?: AbortSignal): Promise<T> {
  const response = await zonaRequest(endpoint, zona, params, 'application/json', signal);
  return response.json() as Promise<T>;
}

// ── Endpoints ───────────────────────────────────────────────────────────

export const getHealth = (signal?: AbortSignal) =>
  requestJson<HealthResponse>(buildUrl('/health'), { signal });

export const getMetadata = (signal?: AbortSignal) =>
  requestJson<Metadata>(buildUrl('/metadata'), { signal });

export const getProvincias = (geometria = false, signal?: AbortSignal) =>
  requestJson<Provincia[]>(buildUrl('/provincias', toQuery({ geometria: String(geometria) })), { signal });

export interface PeriodoParams {
  desde?: string; // YYYY-MM
  hasta?: string; // YYYY-MM
  capa?: Capa;
}

export const getCalendario = (zona: PedidoZona, params: PeriodoParams = {}, signal?: AbortSignal) =>
  zonaJson<CalendarioResponse>('/calendario', zona, { ...params }, signal);

export const getSerie = (
  zona: PedidoZona,
  params: PeriodoParams & { granularidad?: Granularidad } = {},
  signal?: AbortSignal,
) => zonaJson<SerieResponse>('/serie', zona, { ...params }, signal);

export const getAnomalia = (zona: PedidoZona, params: { mes?: string } = {}, signal?: AbortSignal) =>
  zonaJson<AnomaliaResponse>('/anomalia', zona, { ...params }, signal);

export interface MapaCeldasParams {
  bbox: string;
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD (máx. 366 días)
  capa?: Capa;
  min_focos?: number;
}

export const getMapaCeldas = (params: MapaCeldasParams, signal?: AbortSignal) =>
  requestJson<MapaCeldas>(buildUrl('/mapa/celdas', toQuery({ ...params })), { signal });

export const getMapaIndustriales = (bbox?: string, signal?: AbortSignal) =>
  requestJson<MapaIndustriales>(buildUrl('/mapa/industriales', toQuery({ bbox })), { signal });

// ── Descargas CSV ───────────────────────────────────────────────────────

export type DescargaParams =
  | { tipo: 'calendario'; desde?: string; hasta?: string; capa?: Capa }
  | { tipo: 'focos'; desde: string; hasta: string; sensor?: Sensor };

/** Nombre de archivo desde Content-Disposition (o null si no viene). */
export function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * Descarga un CSV (GET para provincia/bbox, POST para polígono) y dispara
 * la descarga en el navegador con el nombre que indica la API.
 * Lanza ApiRequestError con el mensaje de la API si falla (p. ej. 413).
 */
export async function descargarCsv(zona: PedidoZona, params: DescargaParams, fallbackName: string) {
  const { tipo, ...rest } = params;
  const response = await zonaRequest(`/descargas/${tipo}.csv`, zona, rest, 'text/csv', undefined);
  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get('Content-Disposition')) || fallbackName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
