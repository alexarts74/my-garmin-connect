import { Router } from 'express';
import { getClient } from './auth';

const router = Router();

router.get('/today', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const today = new Date();

    const [steps, heartRate, sleep] = await Promise.all([
      client.getSteps(today).catch((e: any) => { console.error('[health] getSteps error:', e.message); return null; }),
      client.getHeartRate(today).catch(() => null),
      client.getSleepData(today).catch(() => null),
    ]);

    console.log('[health] steps raw:', JSON.stringify(steps).slice(0, 500));

    const totalSteps =
      Array.isArray(steps) && steps.length > 0
        ? steps[0]?.totalSteps ?? 0
        : 0;

    const restingHeartRate =
      heartRate && typeof heartRate === 'object'
        ? (heartRate as any).restingHeartRate ?? 0
        : 0;

    const sleepDurationSeconds =
      sleep && typeof sleep === 'object'
        ? (sleep as any).dailySleepDTO?.sleepTimeSeconds ?? 0
        : 0;

    const sleepScore =
      sleep && typeof sleep === 'object'
        ? (sleep as any).dailySleepDTO?.sleepScores?.overall?.value ?? 0
        : 0;

    res.json({
      steps: totalSteps,
      restingHeartRate,
      sleepDurationSeconds,
      sleepScore,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch health data';
    res.status(500).json({ error: message });
  }
});

router.get('/vitals', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const today = new Date();

    const [heartRate, userSettings] = await Promise.all([
      client.getHeartRate(today).catch((e: any) => { console.error('[vitals] getHeartRate error:', e.message); return null; }),
      client.getUserSettings().catch((e: any) => { console.error('[vitals] getUserSettings error:', e.message); return null; }),
    ]);

    console.log('[vitals] heartRate keys:', heartRate ? Object.keys(heartRate) : 'null');
    console.log('[vitals] heartRate sample:', heartRate ? JSON.stringify(heartRate).slice(0, 500) : 'null');
    console.log('[vitals] userSettings keys:', userSettings ? Object.keys(userSettings) : 'null');
    console.log('[vitals] userData:', userSettings ? JSON.stringify((userSettings as any).userData).slice(0, 500) : 'null');

    // Extract detailed HR data
    let latestHeartRate = 0;
    let restingHeartRate = 0;
    let maxHeartRate = 0;
    let minHeartRate = 0;
    let lastSevenDaysAvgRestingHeartRate = 0;

    if (heartRate && typeof heartRate === 'object') {
      const hr = heartRate as any;
      restingHeartRate = hr.restingHeartRate ?? 0;
      maxHeartRate = hr.maxHeartRate ?? 0;
      minHeartRate = hr.minHeartRate ?? 0;
      lastSevenDaysAvgRestingHeartRate = hr.lastSevenDaysAvgRestingHeartRate ?? 0;

      // heartRateValues can be either:
      // - array of [timestamp, heartrate] tuples
      // - array of arrays of {timestamp, heartrate} objects
      if (Array.isArray(hr.heartRateValues)) {
        for (let i = hr.heartRateValues.length - 1; i >= 0; i--) {
          const entry = hr.heartRateValues[i];
          let hrValue = 0;

          if (Array.isArray(entry)) {
            // Tuple format: [timestamp, heartrate]
            if (typeof entry[1] === 'number' && entry[1] > 0) {
              hrValue = entry[1];
            }
            // Array of objects format
            else if (entry.length > 0 && typeof entry[0] === 'object') {
              const last = entry[entry.length - 1];
              if (last?.heartrate > 0) hrValue = last.heartrate;
            }
          } else if (typeof entry === 'object' && entry?.heartrate > 0) {
            hrValue = entry.heartrate;
          }

          if (hrValue > 0) {
            latestHeartRate = hrValue;
            break;
          }
        }
      }
    }

    // Extract VO2 Max from user settings
    let vo2Max = 0;
    if (userSettings && typeof userSettings === 'object') {
      const settings = userSettings as any;
      const v = settings.userData?.vo2MaxRunning;
      if (typeof v === 'number' && v > 0) {
        vo2Max = v;
      }
    }

    res.json({
      latestHeartRate,
      restingHeartRate,
      maxHeartRate,
      minHeartRate,
      lastSevenDaysAvgRestingHeartRate,
      vo2Max,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch vitals';
    res.status(500).json({ error: message });
  }
});

router.get('/sleep', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const today = new Date();
    const sleep = await client.getSleepData(today).catch((e: any) => {
      console.error('[sleep] getSleepData error:', e.message);
      return null;
    });

    if (!sleep || typeof sleep !== 'object') {
      res.json(null);
      return;
    }

    const dto = (sleep as any).dailySleepDTO;
    const sleepLevels: Array<{ startGMT: string; endGMT: string; activityLevel: number }> =
      (sleep as any).sleepLevels ?? [];

    console.log('[sleep] sleepLevels sample:', JSON.stringify(sleepLevels.slice(0, 3)));

    // Compute HR stats from sleepHeartRate array
    const heartRateValues: number[] = [];
    const sleepHeartRate = (sleep as any).sleepHeartRate ?? [];
    if (Array.isArray(sleepHeartRate)) {
      for (const entry of sleepHeartRate) {
        const hr = typeof entry === 'object' ? entry?.heartRateValue ?? entry?.value : null;
        if (typeof hr === 'number' && hr > 0) heartRateValues.push(hr);
      }
    }

    const minSleepHR = heartRateValues.length > 0 ? Math.min(...heartRateValues) : 0;
    const avgSleepHR = heartRateValues.length > 0
      ? Math.round(heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length)
      : 0;

    res.json({
      sleepTimeSeconds: dto?.sleepTimeSeconds ?? 0,
      deepSleepSeconds: dto?.deepSleepSeconds ?? 0,
      lightSleepSeconds: dto?.lightSleepSeconds ?? 0,
      remSleepSeconds: dto?.remSleepSeconds ?? 0,
      awakeSleepSeconds: dto?.awakeSleepSeconds ?? 0,
      sleepStartTimestampGMT: dto?.sleepStartTimestampGMT ?? 0,
      sleepEndTimestampGMT: dto?.sleepEndTimestampGMT ?? 0,
      sleepScore: dto?.sleepScores?.overall?.value ?? 0,
      sleepScores: {
        overall: dto?.sleepScores?.overall ?? null,
        remPercentage: dto?.sleepScores?.remPercentage ?? null,
        deepPercentage: dto?.sleepScores?.deepPercentage ?? null,
        lightPercentage: dto?.sleepScores?.lightPercentage ?? null,
        stress: dto?.sleepScores?.stress ?? null,
        restlessness: dto?.sleepScores?.restlessness ?? null,
        awakeCount: dto?.sleepScores?.awakeCount ?? null,
        totalDuration: dto?.sleepScores?.totalDuration ?? null,
      },
      averageRespirationValue: dto?.averageRespirationValue ?? 0,
      lowestRespirationValue: dto?.lowestRespirationValue ?? 0,
      highestRespirationValue: dto?.highestRespirationValue ?? 0,
      restingHeartRate: dto?.restingHeartRate ?? 0,
      minSleepHR,
      avgSleepHR,
      avgOvernightHrv: dto?.averageOvernightHrv ?? (sleep as any).restingHeartRateHRV ?? 0,
      hrvStatus: dto?.hrvStatus ?? (sleep as any).hrvStatus ?? '',
      bodyBatteryChange: dto?.bodyBatteryChange ?? 0,
      avgSleepStress: dto?.averageSleepStress ?? 0,
      restlessMomentsCount: dto?.restlessMomentsCount ?? 0,
      awakeCount: dto?.awakeCount ?? 0,
      sleepLevels,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch sleep data';
    res.status(500).json({ error: message });
  }
});

export default router;
