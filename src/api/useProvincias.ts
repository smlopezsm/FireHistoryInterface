import { useQuery } from '@tanstack/react-query';
import { getProvincias } from './client';
import type { Provincia } from './types';

export function useProvincias(geometria: boolean = false) {
  return useQuery<Provincia[], Error>({
    queryKey: ['provincias', { geometria }],
    queryFn: ({ signal }) => getProvincias(geometria, signal),
    staleTime: Infinity, // Cambian solo con un nuevo despliegue de datos
    retry: 2,
  });
}
