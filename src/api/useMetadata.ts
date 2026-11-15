import { useQuery } from '@tanstack/react-query';
import { getMetadata } from './client';
import type { Metadata } from './types';

export function useMetadata() {
  return useQuery<Metadata, Error>({
    queryKey: ['metadata'],
    queryFn: ({ signal }) => getMetadata(signal),
    staleTime: 1000 * 60 * 60,
    retry: 3,
  });
}
