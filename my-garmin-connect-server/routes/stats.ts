import { Router } from 'express';
import { getClient } from './auth';

const router = Router();

router.get('/weekly', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const activities = await client.getActivities(0, 100);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyRuns = activities.filter((a: any) => {
      if (a.activityType?.typeKey !== 'running') return false;
      const actDate = new Date(a.startTimeLocal);
      return actDate >= weekAgo;
    });

    const totalDistance = weeklyRuns.reduce(
      (sum: number, a: any) => sum + (a.distance || 0),
      0,
    );
    const totalDuration = weeklyRuns.reduce(
      (sum: number, a: any) => sum + (a.duration || 0),
      0,
    );
    const averagePace =
      totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0; // sec/km

    res.json({
      totalDistance,
      totalDuration,
      runCount: weeklyRuns.length,
      averagePace,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch weekly stats';
    res.status(500).json({ error: message });
  }
});

// ── Trends endpoint ─────────────────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const weeks = Math.min(parseInt(req.query.weeks as string) || 8, 24);

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    // Fetch enough activities to cover the requested weeks
    const activities = await client.getActivities(0, 200);
    const runs = activities.filter((a: any) => {
      if (a.activityType?.typeKey !== 'running') return false;
      const d = new Date(a.startTimeLocal);
      return d >= cutoff;
    });

    // Fetch health data for the latest snapshot
    const [heartRate, userSettings] = await Promise.all([
      client.getHeartRate(now).catch(() => null),
      client.getUserSettings().catch(() => null),
    ]);

    const vo2Max = (userSettings as any)?.userData?.vo2MaxRunning ?? null;
    const restingHR = (heartRate as any)?.restingHeartRate ?? null;

    // Group runs by ISO week
    const weeklyMap = new Map<string, {
      weekStart: string;
      totalDistance: number;
      totalDuration: number;
      runCount: number;
      paces: number[];
    }>();

    for (const run of runs as any[]) {
      const date = new Date(run.startTimeLocal);
      const weekStart = getWeekStart(date);
      const key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          weekStart: key,
          totalDistance: 0,
          totalDuration: 0,
          runCount: 0,
          paces: [],
        });
      }

      const week = weeklyMap.get(key)!;
      week.totalDistance += run.distance || 0;
      week.totalDuration += run.duration || 0;
      week.runCount++;
      if (run.averageSpeed > 0) {
        week.paces.push(1000 / run.averageSpeed); // sec/km
      }
    }

    // Convert map to sorted array
    const weeklyData = Array.from(weeklyMap.values())
      .map((w) => ({
        weekStart: w.weekStart,
        totalDistance: w.totalDistance,
        totalDuration: w.totalDuration,
        runCount: w.runCount,
        averagePace: w.paces.length > 0
          ? w.paces.reduce((a, b) => a + b, 0) / w.paces.length
          : 0,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    // Build daily activity map for heatmap (last N weeks)
    const dailyMap = new Map<string, { distance: number; count: number }>();
    for (const run of runs as any[]) {
      const key = run.startTimeLocal.slice(0, 10);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { distance: 0, count: 0 });
      }
      const day = dailyMap.get(key)!;
      day.distance += run.distance || 0;
      day.count++;
    }

    const dailyActivity = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Best efforts detection for race predictor
    const bestEfforts = detectBestEfforts(runs as any[]);

    res.json({
      weeklyData,
      dailyActivity,
      bestEfforts,
      latestVitals: {
        vo2Max,
        restingHR,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch trends';
    res.status(500).json({ error: message });
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface BestEffort {
  distance: number;       // meters
  label: string;
  time: number;           // seconds
  pace: number;           // sec/km
  date: string;
  activityId: number;
}

function detectBestEfforts(runs: any[]): BestEffort[] {
  const targets = [
    { label: '1K', distance: 1000 },
    { label: '5K', distance: 5000 },
    { label: '10K', distance: 10000 },
    { label: 'Semi', distance: 21097.5 },
    { label: 'Marathon', distance: 42195 },
  ];

  const bestEfforts: BestEffort[] = [];

  for (const target of targets) {
    let bestPace = Infinity;
    let bestRun: any = null;

    for (const run of runs) {
      if (!run.distance || !run.duration || run.distance < target.distance * 0.9) continue;

      // For runs at or above target distance, estimate pace for that distance
      const pace = run.duration / (run.distance / 1000); // sec/km
      if (pace < bestPace) {
        bestPace = pace;
        bestRun = run;
      }
    }

    if (bestRun) {
      const estimatedTime = bestPace * (target.distance / 1000);
      bestEfforts.push({
        distance: target.distance,
        label: target.label,
        time: estimatedTime,
        pace: bestPace,
        date: bestRun.startTimeLocal,
        activityId: bestRun.activityId,
      });
    }
  }

  return bestEfforts;
}

export default router;
