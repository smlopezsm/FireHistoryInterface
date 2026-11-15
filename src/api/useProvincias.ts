import { useQuery } from '@tanstack/react-query';
import { getProvincias } from './client';
import type { Provincia } from './types';

export function useProvincias(geometria: boolean = false) {
  return useQuery<Provincia[], Error>({
    queryKey: ['provincias', { geometria }],
    queryFn: () => getProvincias(geometria),
    staleTime: 1000 * 60 * 60 * 24, // 24 horas de caché
    retry: 2,
  });
}
