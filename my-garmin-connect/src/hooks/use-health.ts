import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { HealthToday, SleepDetail, StressData, Vitals, WeeklyStats } from '@/types/health';

export function useHealthToday() {
  const { isAuthenticated } = useAuth();
  return useQuery<HealthToday>({
    queryKey: ['health', 'today'],
    queryFn: () => get<HealthToday>('/health/today'),
    enabled: isAuthenticated,
  });
}

export function useVitals() {
  const { isAuthenticated } = useAuth();
  return useQuery<Vitals>({
    queryKey: ['health', 'vitals'],
    queryFn: () => get<Vitals>('/health/vitals'),
    enabled: isAuthenticated,
  });
}

export function useSleepDetail() {
  const { isAuthenticated } = useAuth();
  return useQuery<SleepDetail | null>({
    queryKey: ['health', 'sleep'],
    queryFn: () => get<SleepDetail | null>('/health/sleep'),
    enabled: isAuthenticated,
  });
}

export function useStress() {
  const { isAuthenticated } = useAuth();
  return useQuery<StressData | null>({
    queryKey: ['health', 'stress'],
    queryFn: () => get<StressData | null>('/health/stress'),
    enabled: isAuthenticated,
  });
}

export function useWeeklyStats() {
  const { isAuthenticated } = useAuth();
  return useQuery<WeeklyStats>({
    queryKey: ['stats', 'weekly'],
    queryFn: () => get<WeeklyStats>('/stats/weekly'),
    enabled: isAuthenticated,
  });
}
