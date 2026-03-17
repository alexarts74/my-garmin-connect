import type { GarminActivity, GarminActivityDetail } from './garmin';

export interface HealthKitRoute {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: string;
}

export interface RunningFormMetrics {
  /** Average stride length in meters */
  strideLength?: number;
  /** Average ground contact time in milliseconds */
  groundContactTime?: number;
  /** Average vertical oscillation in centimeters */
  verticalOscillation?: number;
  /** Average running power in watts */
  runningPower?: number;
}

export interface HealthKitWorkout {
  uuid: string;
  startDate: string;
  endDate: string;
  duration: number; // seconds
  totalDistance: number; // meters
  totalEnergyBurned: number; // kcal
  route: HealthKitRoute[] | null;
  runningForm: RunningFormMetrics;
}

export interface HRZone {
  zone: number;
  label: string;
  minBpm: number;
  maxBpm: number;
  durationSeconds: number;
  percentage: number;
}

export interface HRVData {
  latestSDNN: number | null;
  date: string | null;
}

export interface HRRecoveryData {
  bpm: number | null;
  date: string | null;
}

/** Garmin activity enriched with HealthKit data */
export interface EnrichedActivity extends GarminActivityDetail {
  healthKit?: {
    matched: true;
    workoutUUID: string;
    route: HealthKitRoute[] | null;
    runningForm: RunningFormMetrics;
  };
}
