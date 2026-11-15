import { useQuery } from '@tanstack/react-query';
import { getCalendario, type CalendarioParams } from './client';
import type { CalendarioResponse } from './types';

export function useCalendario(params: CalendarioParams) {
  const isEnabled = Boolean(params.provincia_id || params.bbox);

  return useQuery<CalendarioResponse, Error>({
    queryKey: ['calendario', params],
    queryFn: () => getCalendario(params),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 60, // 1 hora de caché
    retry: 2,
  });
}
