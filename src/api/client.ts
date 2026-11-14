import type { ApiError, Metadata } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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

export async function getMetadata(): Promise<Metadata> {
  return fetchApi<Metadata>('/metadata');
}
