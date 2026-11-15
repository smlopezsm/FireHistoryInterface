import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ApiRequestError, getAnomalia, getCalendario, getSerie, type PeriodoParams } from './client';
import type { AnomaliaResponse, CalendarioResponse, Granularidad, PedidoZona, SerieResponse } from './types';

const HORA = 1000 * 60 * 60;

/** No reintentar errores del usuario (4xx): solo fallas de red o 5xx. */
export const retryServidor = (failureCount: number, error: Error) =>
  !(error instanceof ApiRequestError && error.status < 500) && failureCount < 2;

// TanStack Query pasa `signal`: al cambiar zona o período, el pedido viejo se cancela.

export function useCalendario(zona: PedidoZona | null, params: PeriodoParams = {}) {
  return useQuery<CalendarioResponse, Error>({
    queryKey: ['calendario', zona, params],
    queryFn: ({ signal }) => getCalendario(zona!, params, signal),
    enabled: zona !== null,
    staleTime: HORA,
    retry: retryServidor,
  });
}

export function useSerie(zona: PedidoZona | null, params: PeriodoParams & { granularidad?: Granularidad } = {}) {
  return useQuery<SerieResponse, Error>({
    queryKey: ['serie', zona, params],
    queryFn: ({ signal }) => getSerie(zona!, params, signal),
    enabled: zona !== null,
    staleTime: HORA,
    retry: retryServidor,
    placeholderData: keepPreviousData,
  });
}

export function useAnomalia(zona: PedidoZona | null, mes?: string) {
  return useQuery<AnomaliaResponse, Error>({
    queryKey: ['anomalia', zona, mes ?? null],
    queryFn: ({ signal }) => getAnomalia(zona!, mes ? { mes } : {}, signal),
    enabled: zona !== null,
    staleTime: HORA,
    retry: retryServidor,
  });
}
