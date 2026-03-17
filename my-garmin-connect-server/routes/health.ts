import { Router } from 'express';
import { getClient } from './auth';
import { computeSleepScores } from '../lib/sleep-scoring';
import { generateTrainingPrediction } from '../lib/sleep-training-prediction';

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

    // Extract body battery data from sleep
    let bodyBatteryChange = 0;
    let bodyBatteryAtSleep = 0;
    let bodyBatteryAtWake = 0;

    if (sleep && typeof sleep === 'object') {
      const dto = (sleep as any).dailySleepDTO;
      bodyBatteryChange = dto?.bodyBatteryChange ?? 0;

      const sleepBodyBattery: Array<{ value: number; startGMT?: string }> =
        (sleep as any).sleepBodyBattery ?? [];
      if (Array.isArray(sleepBodyBattery) && sleepBodyBattery.length > 0) {
        bodyBatteryAtSleep = sleepBodyBattery[0]?.value ?? 0;
        bodyBatteryAtWake = sleepBodyBattery[sleepBodyBattery.length - 1]?.value ?? 0;
      }

      // Fallback: direct DTO fields
      if (bodyBatteryAtSleep === 0 && typeof dto?.bodyBatteryAtSleep === 'number') {
        bodyBatteryAtSleep = dto.bodyBatteryAtSleep;
      }
      if (bodyBatteryAtWake === 0 && typeof dto?.bodyBatteryAtWake === 'number') {
        bodyBatteryAtWake = dto.bodyBatteryAtWake;
      }
      if (bodyBatteryAtWake === 0 && typeof dto?.bodyBatteryMostRecentValue === 'number') {
        bodyBatteryAtWake = dto.bodyBatteryMostRecentValue;
      }

      // Compute delta if not provided
      if (bodyBatteryChange === 0 && bodyBatteryAtSleep > 0 && bodyBatteryAtWake > 0) {
        bodyBatteryChange = bodyBatteryAtWake - bodyBatteryAtSleep;
      }
    }

    res.json({
      steps: totalSteps,
      restingHeartRate,
      sleepDurationSeconds,
      sleepScore,
      bodyBatteryChange,
      bodyBatteryAtSleep,
      bodyBatteryAtWake,
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
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const [sleep, stressData] = await Promise.all([
      client.getSleepData(today).catch((e: any) => {
        console.error('[sleep] getSleepData error:', e.message);
        return null;
      }),
      client.get<any>(
        `https://connectapi.garmin.com/wellness-service/wellness/dailyStress/${dateStr}`
      ).catch((e: any) => {
        console.error('[sleep] stress endpoint error:', e.message);
        return null;
      }),
    ]);

    if (!sleep || typeof sleep !== 'object') {
      res.json(null);
      return;
    }

    const dto = (sleep as any).dailySleepDTO;
    const sleepLevels: Array<{ startGMT: string; endGMT: string; activityLevel: number }> =
      (sleep as any).sleepLevels ?? [];

    console.log('[sleep] sleepLevels sample:', JSON.stringify(sleepLevels.slice(0, 3)));
    console.log('[sleep] sleepScores raw:', JSON.stringify(dto?.sleepScores));

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

    // Normalize Garmin sleep score components (handle value/score/scoreValue variants)
    function normalizeSleepScoreComponent(raw: any): { value: number | null; qualifierKey: string } | null {
      if (!raw || typeof raw !== 'object') return null;
      const value = raw.value ?? raw.score ?? raw.scoreValue ?? null;
      const qualifierKey = raw.qualifierKey ?? raw.qualifier ?? raw.qualityLevel ?? '';
      return { value: typeof value === 'number' ? value : null, qualifierKey };
    }

    const sleepTimeSeconds = dto?.sleepTimeSeconds ?? 0;
    const deepSleepSeconds = dto?.deepSleepSeconds ?? 0;
    const lightSleepSeconds = dto?.lightSleepSeconds ?? 0;
    const remSleepSeconds = dto?.remSleepSeconds ?? 0;
    const awakeSleepSeconds = dto?.awakeSleepSeconds ?? 0;
    // Compute avg sleep stress from stressValuesArray filtered by sleep window
    let avgSleepStress = dto?.averageSleepStress ?? 0;
    if (avgSleepStress === 0 && stressData?.stressValuesArray && dto?.sleepStartTimestampGMT && dto?.sleepEndTimestampGMT) {
      const sleepStart = new Date(dto.sleepStartTimestampGMT).getTime();
      const sleepEnd = new Date(dto.sleepEndTimestampGMT).getTime();
      const sleepStressValues: number[] = [];
      for (const [ts, val] of stressData.stressValuesArray) {
        if (ts >= sleepStart && ts <= sleepEnd && val > 0) {
          sleepStressValues.push(val);
        }
      }
      if (sleepStressValues.length > 0) {
        avgSleepStress = Math.round(sleepStressValues.reduce((a: number, b: number) => a + b, 0) / sleepStressValues.length);
      }
    }
    const avgOvernightHrv = dto?.averageOvernightHrv ?? (sleep as any).restingHeartRateHRV ?? 0;

    // Compute custom sleep scores
    const computedScores = computeSleepScores({
      sleepTimeSeconds,
      deepSleepSeconds,
      lightSleepSeconds,
      remSleepSeconds,
      awakeSleepSeconds,
      avgSleepStress,
      avgOvernightHrv,
    });

    // Generate training prediction
    const trainingPrediction = generateTrainingPrediction(computedScores);

    res.json({
      sleepTimeSeconds,
      deepSleepSeconds,
      lightSleepSeconds,
      remSleepSeconds,
      awakeSleepSeconds,
      sleepStartTimestampGMT: dto?.sleepStartTimestampGMT ?? 0,
      sleepEndTimestampGMT: dto?.sleepEndTimestampGMT ?? 0,
      sleepScore: dto?.sleepScores?.overall?.value ?? 0,
      sleepScores: {
        overall: normalizeSleepScoreComponent(dto?.sleepScores?.overall),
        remPercentage: normalizeSleepScoreComponent(dto?.sleepScores?.remPercentage),
        deepPercentage: normalizeSleepScoreComponent(dto?.sleepScores?.deepPercentage),
        lightPercentage: normalizeSleepScoreComponent(dto?.sleepScores?.lightPercentage),
        stress: normalizeSleepScoreComponent(dto?.sleepScores?.stress),
        restlessness: normalizeSleepScoreComponent(dto?.sleepScores?.restlessness),
        awakeCount: normalizeSleepScoreComponent(dto?.sleepScores?.awakeCount),
        totalDuration: normalizeSleepScoreComponent(dto?.sleepScores?.totalDuration),
      },
      computedScores,
      trainingPrediction,
      averageRespirationValue: dto?.averageRespirationValue ?? 0,
      lowestRespirationValue: dto?.lowestRespirationValue ?? 0,
      highestRespirationValue: dto?.highestRespirationValue ?? 0,
      restingHeartRate: dto?.restingHeartRate ?? 0,
      minSleepHR,
      avgSleepHR,
      avgOvernightHrv: avgOvernightHrv,
      hrvStatus: dto?.hrvStatus ?? (sleep as any).hrvStatus ?? '',
      ...(() => {
        // Try multiple sources for body battery data
        const sleepBodyBattery: Array<{ value: number }> = (sleep as any).sleepBodyBattery ?? [];
        const bodyBatteryArr = (sleep as any).bodyBattery ?? [];

        console.log('[sleep] bodyBattery sources:', {
          'dto.bodyBatteryChange': dto?.bodyBatteryChange,
          'dto.bodyBatteryAtSleep': dto?.bodyBatteryAtSleep,
          'dto.bodyBatteryAtWake': dto?.bodyBatteryAtWake,
          'dto.bodyBatteryMostRecentValue': dto?.bodyBatteryMostRecentValue,
          'sleepBodyBattery.length': sleepBodyBattery.length,
          'sleepBodyBattery[0]': sleepBodyBattery[0],
          'sleepBodyBattery[last]': sleepBodyBattery.length > 0 ? sleepBodyBattery[sleepBodyBattery.length - 1] : null,
          'bodyBattery.length': bodyBatteryArr.length,
          'bodyBattery[0]': bodyBatteryArr[0],
        });

        let atSleep = 0;
        let atWake = 0;

        // Source 1: sleepBodyBattery array
        if (Array.isArray(sleepBodyBattery) && sleepBodyBattery.length > 0) {
          atSleep = sleepBodyBattery[0]?.value ?? 0;
          atWake = sleepBodyBattery[sleepBodyBattery.length - 1]?.value ?? 0;
        }

        // Source 2: direct DTO fields
        if (atSleep === 0 && typeof dto?.bodyBatteryAtSleep === 'number') {
          atSleep = dto.bodyBatteryAtSleep;
        }
        if (atWake === 0 && typeof dto?.bodyBatteryAtWake === 'number') {
          atWake = dto.bodyBatteryAtWake;
        }
        if (atWake === 0 && typeof dto?.bodyBatteryMostRecentValue === 'number') {
          atWake = dto.bodyBatteryMostRecentValue;
        }

        // Source 3: bodyBattery array (different from sleepBodyBattery)
        if (Array.isArray(bodyBatteryArr) && bodyBatteryArr.length > 0 && atSleep === 0) {
          atSleep = bodyBatteryArr[0]?.value ?? bodyBatteryArr[0]?.[1] ?? 0;
          atWake = bodyBatteryArr[bodyBatteryArr.length - 1]?.value ?? bodyBatteryArr[bodyBatteryArr.length - 1]?.[1] ?? 0;
        }

        // Compute delta: prefer DTO value, fallback to manual calc
        let change = dto?.bodyBatteryChange ?? 0;
        if (change === 0 && atSleep > 0 && atWake > 0) {
          change = atWake - atSleep;
        }

        return {
          bodyBatteryChange: change,
          bodyBatteryAtSleep: atSleep,
          bodyBatteryAtWake: atWake,
        };
      })(),
      avgSleepStress: avgSleepStress,
      restlessMomentsCount: dto?.restlessMomentsCount ?? sleepLevels.filter((l: any) => l.activityLevel >= 1).length,
      awakeCount: dto?.awakeCount ?? sleepLevels.filter((l: any) => l.activityLevel >= 2).length,
      sleepLevels,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch sleep data';
    res.status(500).json({ error: message });
  }
});

router.get('/stress', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Try multiple known Garmin stress endpoints
    const endpoints = [
      `https://connectapi.garmin.com/usersummary-service/usersummary/daily/${dateStr}?calendarDate=${dateStr}`,
      `https://connectapi.garmin.com/usersummary-service/usersummary/dailyStress/${dateStr}`,
      `https://connectapi.garmin.com/wellness-service/wellness/dailyStress/${dateStr}`,
    ];

    let stress: any = null;
    for (const url of endpoints) {
      try {
        const result = await client.get<any>(url);
        console.log(`[stress] ${url} keys:`, result ? Object.keys(result) : 'null');
        console.log(`[stress] ${url} sample:`, result ? JSON.stringify(result).slice(0, 1000) : 'null');
        if (result && typeof result === 'object' && ('avgStressLevel' in result || 'overallStressLevel' in result)) {
          stress = result;
          break;
        }
      } catch (e: any) {
        console.error(`[stress] ${url} error:`, e.message);
      }
    }

    if (!stress) {
      res.json(null);
      return;
    }

    // Compute duration breakdowns from stressValuesArray
    // Each entry is ~3 minutes apart (180 seconds)
    // Values: -1/-2 = unmeasured/rest, 1-25 = rest, 26-50 = low, 51-75 = medium, 76-100 = high
    const INTERVAL_SECONDS = 180;
    let restSeconds = 0;
    let lowSeconds = 0;
    let mediumSeconds = 0;
    let highSeconds = 0;

    const stressValues: Array<[number, number]> = stress.stressValuesArray ?? [];
    for (const [, value] of stressValues) {
      if (value <= 0) {
        restSeconds += INTERVAL_SECONDS; // unmeasured or rest/sleep
      } else if (value <= 25) {
        restSeconds += INTERVAL_SECONDS;
      } else if (value <= 50) {
        lowSeconds += INTERVAL_SECONDS;
      } else if (value <= 75) {
        mediumSeconds += INTERVAL_SECONDS;
      } else {
        highSeconds += INTERVAL_SECONDS;
      }
    }

    const avgLevel = stress.avgStressLevel ?? 0;
    let qualifier = 'UNKNOWN';
    if (avgLevel > 0 && avgLevel <= 25) qualifier = 'REST';
    else if (avgLevel <= 50) qualifier = 'LOW';
    else if (avgLevel <= 75) qualifier = 'MEDIUM';
    else if (avgLevel > 75) qualifier = 'HIGH';

    res.json({
      overallLevel: avgLevel,
      restLevel: restSeconds,
      maxLevel: stress.maxStressLevel ?? 0,
      lowDurationSeconds: lowSeconds,
      mediumDurationSeconds: mediumSeconds,
      highDurationSeconds: highSeconds,
      stressQualifier: qualifier,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch stress data';
    res.status(500).json({ error: message });
  }
});

export default router;
