import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { GarminActivity, GarminActivityDetail } from '@/types/garmin';

export function useActivities() {
  const { isAuthenticated } = useAuth();
  return useQuery<GarminActivity[]>({
    queryKey: ['activities'],
    queryFn: () => get<GarminActivity[]>('/activities?start=0&limit=50'),
    enabled: isAuthenticated,
  });
}

export function useActivity(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery<GarminActivityDetail>({
    queryKey: ['activity', id],
    queryFn: () => get<GarminActivityDetail>(`/activities/${id}`),
    enabled: isAuthenticated && !!id,
  });
}
