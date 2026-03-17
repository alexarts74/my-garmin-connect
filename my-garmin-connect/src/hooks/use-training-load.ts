import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { TrainingLoadData } from '@/types/training-load';

export function useTrainingLoad() {
  const { isAuthenticated } = useAuth();
  return useQuery<TrainingLoadData>({
    queryKey: ['training-load'],
    queryFn: () => get<TrainingLoadData>('/training-load'),
    enabled: isAuthenticated,
  });
}
