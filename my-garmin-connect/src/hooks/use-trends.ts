import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { TrendsData } from '@/types/trends';

export function useTrends(weeks: number = 8) {
  const { isAuthenticated } = useAuth();
  return useQuery<TrendsData>({
    queryKey: ['stats', 'trends', weeks],
    queryFn: () => get<TrendsData>(`/stats/trends?weeks=${weeks}`),
    enabled: isAuthenticated,
  });
}
