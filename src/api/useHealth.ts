import { useQuery } from '@tanstack/react-query';
import { getHealth } from './client';
import type { HealthResponse } from './types';

export function useHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000, // Revalida automáticamente cada 30 segundos
    retry: 1,
  });
}
