import { useMemo } from 'react';
import { useActivities } from '@/hooks/use-activities';

export function useCaloriesBurned(date: string) {
  const { data: activities, isLoading } = useActivities();

  const caloriesBurned = useMemo(() => {
    if (!activities) return undefined;
    const todayActivities = activities.filter((a) =>
      a.startTimeLocal.startsWith(date),
    );
    if (todayActivities.length === 0) return undefined;
    return todayActivities.reduce((sum, a) => sum + a.calories, 0);
  }, [activities, date]);

  return { caloriesBurned, isLoading };
}
