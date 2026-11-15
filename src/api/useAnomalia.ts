import { useQuery } from '@tanstack/react-query';
import { getAnomalia, type AnomaliaParams } from './client';
import type { AnomaliaResponse } from './types';

export function useAnomalia(params: AnomaliaParams) {
  const isEnabled = Boolean(params.provincia_id || params.bbox);

  return useQuery<AnomaliaResponse, Error>({
    queryKey: ['anomalia', params],
    queryFn: () => getAnomalia(params),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 60, // 1 hora de caché
    retry: 2,
  });
}
