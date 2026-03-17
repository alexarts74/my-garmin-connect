import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { HealthKitWorkout, HealthKitRoute, RunningFormMetrics, HRZone, HRVData, HRRecoveryData } from '@/types/healthkit';

// HealthKit is iOS-only
const isIOS = Platform.OS === 'ios';

type HKModule = typeof import('@kingstinct/react-native-healthkit');
let HK: HKModule | null = null;
if (isIOS) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  HK = require('@kingstinct/react-native-healthkit');
}

export function useHealthKitAuth() {
  const [authorized, setAuthorized] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (!isIOS || !HK || requested.current) return;
    requested.current = true;

    const request = async () => {
      try {
        await HK!.requestAuthorization({
          toRead: [
            'HKQuantityTypeIdentifierDistanceWalkingRunning',
            'HKQuantityTypeIdentifierRunningStrideLength',
            'HKQuantityTypeIdentifierRunningGroundContactTime',
            'HKQuantityTypeIdentifierRunningVerticalOscillation',
            'HKQuantityTypeIdentifierRunningPower',
            'HKQuantityTypeIdentifierHeartRate',
            'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
            'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
            'HKWorkoutTypeIdentifier',
          ],
        });
        setAuthorized(true);
      } catch (e) {
        console.warn('[HealthKit] Authorization failed:', e);
      }
    };

    request();
  }, []);

  return authorized;
}

async function queryWorkoutRoute(
  workout: Awaited<ReturnType<NonNullable<typeof HK>['queryWorkoutSamples']>>[number],
): Promise<HealthKitRoute[] | null> {
  try {
    const routes = await workout.getWorkoutRoutes();
    if (!routes || routes.length === 0) return null;

    return routes.flatMap((route) =>
      route.locations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude,
        timestamp: loc.date.toISOString(),
      })),
    );
  } catch {
    return null;
  }
}

async function queryRunningFormForWorkout(
  workout: Awaited<ReturnType<NonNullable<typeof HK>['queryWorkoutSamples']>>[number],
): Promise<RunningFormMetrics> {
  if (!HK) return {};

  const metrics: RunningFormMetrics = {};
  const filter = { workout };

  try {
    const strideSamples = await HK.queryQuantitySamples(
      'HKQuantityTypeIdentifierRunningStrideLength',
      { filter, limit: 0, unit: 'm' },
    );
    if (strideSamples.length > 0) {
      const avg = strideSamples.reduce((sum, s) => sum + s.quantity, 0) / strideSamples.length;
      metrics.strideLength = Math.round(avg * 100) / 100;
    }
  } catch { /* not available */ }

  try {
    const gctSamples = await HK.queryQuantitySamples(
      'HKQuantityTypeIdentifierRunningGroundContactTime',
      { filter, limit: 0, unit: 'ms' },
    );
    if (gctSamples.length > 0) {
      const avg = gctSamples.reduce((sum, s) => sum + s.quantity, 0) / gctSamples.length;
      metrics.groundContactTime = Math.round(avg);
    }
  } catch { /* not available */ }

  try {
    const voSamples = await HK.queryQuantitySamples(
      'HKQuantityTypeIdentifierRunningVerticalOscillation',
      { filter, limit: 0, unit: 'cm' },
    );
    if (voSamples.length > 0) {
      const avg = voSamples.reduce((sum, s) => sum + s.quantity, 0) / voSamples.length;
      metrics.verticalOscillation = Math.round(avg * 10) / 10;
    }
  } catch { /* not available */ }

  try {
    const powerSamples = await HK.queryQuantitySamples(
      'HKQuantityTypeIdentifierRunningPower',
      { filter, limit: 0, unit: 'W' },
    );
    if (powerSamples.length > 0) {
      const avg = powerSamples.reduce((sum, s) => sum + s.quantity, 0) / powerSamples.length;
      metrics.runningPower = Math.round(avg);
    }
  } catch { /* not available */ }

  return metrics;
}

/**
 * Find the HealthKit workout matching a Garmin activity by date and distance.
 * Tolerance: ±5 minutes on start time, ±10% on distance.
 */
export function useHealthKitWorkout(startTimeLocal: string | undefined, distanceMeters: number | undefined) {
  const [workout, setWorkout] = useState<HealthKitWorkout | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkout = useCallback(async () => {
    if (!isIOS || !HK || !startTimeLocal || !distanceMeters) return;

    setLoading(true);
    try {
      const activityDate = new Date(startTimeLocal);
      const searchFrom = new Date(activityDate.getTime() - 5 * 60 * 1000);
      const searchTo = new Date(activityDate.getTime() + 5 * 60 * 1000);

      const workouts = await HK.queryWorkoutSamples({
        limit: 10,
        filter: {
          date: {
            startDate: searchFrom,
            endDate: searchTo,
          },
        },
      });

      // Find best match by distance (within 10% tolerance)
      const match = workouts.find((w) => {
        const dist = w.totalDistance?.quantity ?? 0;
        return Math.abs(dist - distanceMeters) / distanceMeters < 0.1;
      });

      if (!match) {
        setWorkout(null);
        setLoading(false);
        return;
      }

      const [route, runningForm] = await Promise.all([
        queryWorkoutRoute(match),
        queryRunningFormForWorkout(match),
      ]);

      setWorkout({
        uuid: match.uuid,
        startDate: match.startDate.toISOString(),
        endDate: match.endDate.toISOString(),
        duration: match.duration.quantity,
        totalDistance: match.totalDistance?.quantity ?? 0,
        totalEnergyBurned: match.totalEnergyBurned?.quantity ?? 0,
        route,
        runningForm,
      });
    } catch (e) {
      console.warn('[HealthKit] Failed to query workout:', e);
      setWorkout(null);
    } finally {
      setLoading(false);
    }
  }, [startTimeLocal, distanceMeters]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  return { workout, loading };
}

const ZONE_LABELS = ['Z1 Recovery', 'Z2 Easy', 'Z3 Tempo', 'Z4 Threshold', 'Z5 Max'];
const ZONE_THRESHOLDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]; // % of max HR

function computeHRZones(hrSamples: readonly { quantity: number; startDate: Date; endDate: Date }[], maxHR: number): HRZone[] {
  if (hrSamples.length === 0 || maxHR <= 0) return [];

  const zoneDurations = [0, 0, 0, 0, 0];

  for (let i = 0; i < hrSamples.length; i++) {
    const sample = hrSamples[i];
    const ratio = sample.quantity / maxHR;
    // Duration: time until next sample, or 1s for the last sample
    const duration = i < hrSamples.length - 1
      ? (hrSamples[i + 1].startDate.getTime() - sample.startDate.getTime()) / 1000
      : 1;
    const clampedDuration = Math.min(Math.max(duration, 0), 60); // cap at 60s gap

    if (ratio < ZONE_THRESHOLDS[1]) zoneDurations[0] += clampedDuration;
    else if (ratio < ZONE_THRESHOLDS[2]) zoneDurations[1] += clampedDuration;
    else if (ratio < ZONE_THRESHOLDS[3]) zoneDurations[2] += clampedDuration;
    else if (ratio < ZONE_THRESHOLDS[4]) zoneDurations[3] += clampedDuration;
    else zoneDurations[4] += clampedDuration;
  }

  const total = zoneDurations.reduce((a, b) => a + b, 0);

  return zoneDurations.map((dur, i) => ({
    zone: i + 1,
    label: ZONE_LABELS[i],
    minBpm: Math.round(maxHR * ZONE_THRESHOLDS[i]),
    maxBpm: Math.round(maxHR * ZONE_THRESHOLDS[i + 1]),
    durationSeconds: Math.round(dur),
    percentage: total > 0 ? Math.round((dur / total) * 100) : 0,
  }));
}

/**
 * Query HR samples for a matched HealthKit workout and compute HR zones.
 */
export function useHRZones(
  hkWorkout: HealthKitWorkout | null,
  maxHR: number | undefined,
) {
  const [zones, setZones] = useState<HRZone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isIOS || !HK || !hkWorkout || !maxHR || maxHR <= 0) {
      setZones([]);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const samples = await HK!.queryQuantitySamples(
          'HKQuantityTypeIdentifierHeartRate',
          {
            filter: {
              date: {
                startDate: new Date(hkWorkout.startDate),
                endDate: new Date(hkWorkout.endDate),
              },
            },
            limit: 0,
            unit: 'count/min',
          },
        );
        if (!cancelled) {
          setZones(computeHRZones(samples, maxHR));
        }
      } catch {
        if (!cancelled) setZones([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [hkWorkout, maxHR]);

  return { zones, loading };
}

/**
 * Query latest HRV (SDNN) value from HealthKit.
 */
export function useHRV() {
  const [hrv, setHRV] = useState<HRVData>({ latestSDNN: null, date: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isIOS || !HK) return;

    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const samples = await HK!.queryQuantitySamples(
          'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
          {
            limit: 1,
            unit: 'ms',
            ascending: false,
          },
        );
        if (!cancelled && samples.length > 0) {
          setHRV({
            latestSDNN: Math.round(samples[0].quantity),
            date: samples[0].startDate.toISOString(),
          });
        }
      } catch {
        // HRV not available
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { hrv, loading };
}

/**
 * Query latest Heart Rate Recovery (1 min) from HealthKit.
 */
export function useHRRecovery() {
  const [recovery, setRecovery] = useState<HRRecoveryData>({ bpm: null, date: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isIOS || !HK) return;

    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const samples = await HK!.queryQuantitySamples(
          'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
          {
            limit: 1,
            unit: 'count/min',
            ascending: false,
          },
        );
        if (!cancelled && samples.length > 0) {
          setRecovery({
            bpm: Math.round(samples[0].quantity),
            date: samples[0].startDate.toISOString(),
          });
        }
      } catch {
        // HR Recovery not available
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { recovery, loading };
}
