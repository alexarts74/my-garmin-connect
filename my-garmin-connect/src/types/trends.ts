export interface WeeklyTrendData {
  weekStart: string;
  totalDistance: number; // meters
  totalDuration: number; // seconds
  runCount: number;
  averagePace: number; // sec/km
}

export interface DailyActivity {
  date: string;
  distance: number; // meters
  count: number;
}

export interface BestEffort {
  distance: number; // meters
  label: string;
  time: number; // seconds
  pace: number; // sec/km
  date: string;
  activityId: number;
}

export interface TrendsData {
  weeklyData: WeeklyTrendData[];
  dailyActivity: DailyActivity[];
  bestEfforts: BestEffort[];
  latestVitals: {
    vo2Max: number | null;
    restingHR: number | null;
  };
}
