import { useQuery } from '@tanstack/react-query';
import {
  ApiRequestError,
  getAnomalia,
  getCalendario,
  getMapaCeldas,
  getSerie,
  type MapaCeldasParams,
  type PeriodoParams,
} from './client';
import type { AnomaliaResponse, CalendarioResponse, Granularidad, MapaCeldas, PedidoZona, SerieResponse } from './types';

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

type ParamsSerie = PeriodoParams & { granularidad?: Granularidad };

/**
 * La curva anterior solo se conserva mientras carga la nueva si cambió **únicamente** la
 * granularidad: con otra zona, período o capa, mostrarla sería mostrar datos que no
 * corresponden al encabezado.
 */
export const soloCambiaGranularidad = (
  previa: readonly unknown[] | undefined,
  zona: PedidoZona | null,
  params: ParamsSerie,
): boolean => {
  if (!previa) return false;
  const [, zonaPrevia, paramsPrevios] = previa as [string, PedidoZona | null, ParamsSerie | undefined];
  const sinGranularidad = ({ granularidad: _g, ...resto }: ParamsSerie = {}) => resto;
  return (
    JSON.stringify(zonaPrevia) === JSON.stringify(zona) &&
    JSON.stringify(sinGranularidad(paramsPrevios)) === JSON.stringify(sinGranularidad(params))
  );
};

export function useSerie(zona: PedidoZona | null, params: ParamsSerie = {}) {
  return useQuery<SerieResponse, Error>({
    queryKey: ['serie', zona, params],
    queryFn: ({ signal }) => getSerie(zona!, params, signal),
    enabled: zona !== null,
    staleTime: HORA,
    retry: retryServidor,
    placeholderData: (previo, consultaPrevia) =>
      soloCambiaGranularidad(consultaPrevia?.queryKey, zona, params) ? previo : undefined,
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

/**
 * Celdas del mapa para un mes. Con TanStack Query, volver a un mes ya visto sale de la
 * caché (útil en el timelapse) y la petición que queda obsoleta se cancela con `signal`.
 * `null` = todavía no hay parámetros (falta /metadata).
 */
export function useMapaCeldas(params: MapaCeldasParams | null) {
  return useQuery<MapaCeldas, Error>({
    queryKey: ['mapaCeldas', params],
    queryFn: ({ signal }) => getMapaCeldas(params!, signal),
    enabled: params !== null,
    staleTime: HORA,
    retry: retryServidor,
  });
}
