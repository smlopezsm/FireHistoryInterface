import { useQuery } from '@tanstack/react-query';
import { getMetadata } from './client';
import type { Metadata } from './types';

export function useMetadata() {
  return useQuery<Metadata, Error>({
    queryKey: ['metadata'],
    queryFn: getMetadata,
    staleTime: 1000 * 60 * 60, // 1 hora de caché
    retry: 3,
  });
}
