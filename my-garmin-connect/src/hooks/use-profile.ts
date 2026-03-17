import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile } from '@/types/profile';

export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => get<UserProfile>('/profile'),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
