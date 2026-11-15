import { useQuery } from '@tanstack/react-query';
import { getMapaCeldas, type MapaCeldasParams } from './client';
import type { GeoJSON } from './types';

export function useMapaCeldas(params: MapaCeldasParams, enabled: boolean = true) {
  return useQuery<GeoJSON.FeatureCollection, Error>({
    queryKey: ['mapaCeldas', params],
    queryFn: () => getMapaCeldas(params),
    enabled: Boolean(enabled && params.bbox && params.desde && params.hasta),
    staleTime: 1000 * 60 * 10, // 10 minutos de caché
    retry: 1,
  });
}
