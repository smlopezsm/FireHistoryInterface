import { useQuery } from '@tanstack/react-query';
import { getHealth } from './client';
import type { HealthResponse } from './types';

export function useHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 30000, // Revalida cada 30 segundos
    retry: 1,
  });
}
