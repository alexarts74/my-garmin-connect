export interface HealthToday {
  steps: number;
  restingHeartRate: number;
  sleepDurationSeconds: number;
  sleepScore: number;
  bodyBatteryChange: number;
  bodyBatteryAtSleep: number;
  bodyBatteryAtWake: number;
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

export interface ScoreDetail {
  score: number;
  label: string;
  detail: string;
}

export interface ComputedSleepScores {
  overall: ScoreDetail;
  duration: ScoreDetail;
  deep: ScoreDetail;
  rem: ScoreDetail;
  light: ScoreDetail;
  awake: ScoreDetail;
  stress: ScoreDetail;
  hrv: ScoreDetail;
}

export interface TrainingPrediction {
  recommendedIntensity: 'high' | 'moderate' | 'easy' | 'rest';
  intensityLabel: string;
  maxRecommendedDuration: number;
  warnings: string[];
  positives: string[];
  recoveryQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recoveryDetail: string;
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
  computedScores: ComputedSleepScores;
  trainingPrediction: TrainingPrediction;
  averageRespirationValue: number;
  lowestRespirationValue: number;
  highestRespirationValue: number;
  restingHeartRate: number;
  minSleepHR: number;
  avgSleepHR: number;
  avgOvernightHrv: number;
  hrvStatus: string;
  bodyBatteryChange: number;
  bodyBatteryAtSleep: number;
  bodyBatteryAtWake: number;
  avgSleepStress: number;
  restlessMomentsCount: number;
  awakeCount: number;
  sleepLevels: SleepLevel[];
}

export interface StressData {
  overallLevel: number;
  restLevel: number;
  maxLevel: number;
  lowDurationSeconds: number;
  mediumDurationSeconds: number;
  highDurationSeconds: number;
  stressQualifier: string;
}

export interface WeeklyStats {
  totalDistance: number; // meters
  totalDuration: number; // seconds
  runCount: number;
  averagePace: number; // seconds per km
}
