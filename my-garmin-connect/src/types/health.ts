export interface HealthToday {
  steps: number;
  restingHeartRate: number;
  sleepDurationSeconds: number;
  sleepScore: number;
}

export interface Vitals {
  latestHeartRate: number;
  restingHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  lastSevenDaysAvgRestingHeartRate: number;
  vo2Max: number;
}

export interface SleepScoreComponent {
  value?: number;
  qualifierKey: string;
  optimalStart?: number;
  optimalEnd?: number;
}

export interface SleepLevel {
  startGMT: string;
  endGMT: string;
  activityLevel: number;
}

export interface SleepDetail {
  sleepTimeSeconds: number;
  deepSleepSeconds: number;
  lightSleepSeconds: number;
  remSleepSeconds: number;
  awakeSleepSeconds: number;
  sleepStartTimestampGMT: number;
  sleepEndTimestampGMT: number;
  sleepScore: number;
  sleepScores: {
    overall: SleepScoreComponent | null;
    remPercentage: SleepScoreComponent | null;
    deepPercentage: SleepScoreComponent | null;
    lightPercentage: SleepScoreComponent | null;
    stress: SleepScoreComponent | null;
    restlessness: SleepScoreComponent | null;
    awakeCount: SleepScoreComponent | null;
    totalDuration: SleepScoreComponent | null;
  };
  averageRespirationValue: number;
  lowestRespirationValue: number;
  highestRespirationValue: number;
  restingHeartRate: number;
  minSleepHR: number;
  avgSleepHR: number;
  avgOvernightHrv: number;
  hrvStatus: string;
  bodyBatteryChange: number;
  avgSleepStress: number;
  restlessMomentsCount: number;
  awakeCount: number;
  sleepLevels: SleepLevel[];
}

export interface WeeklyStats {
  totalDistance: number; // meters
  totalDuration: number; // seconds
  runCount: number;
  averagePace: number; // seconds per km
}
