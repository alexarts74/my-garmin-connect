import { Router } from 'express';
import { getClient } from './auth';
import type { GarminConnect } from 'garmin-connect';

const router = Router();

// Lap cache: activity details never change, so cache permanently
const lapCache = new Map<number, any>();

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

    // Best efforts detection for race predictor (async: fetches lap data)
    const bestEfforts = await detectBestEfforts(client, runs as any[]);

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
  source?: 'activity' | 'laps';
  confidence?: number;    // 0-1
}

const TARGETS = [
  { label: '1K', distance: 1000 },
  { label: '5K', distance: 5000 },
  { label: '10K', distance: 10000 },
  { label: 'Semi', distance: 21097.5 },
  { label: 'Marathon', distance: 42195 },
];

// Select 10-15 "promising" activities for detailed lap analysis
function selectCandidates(runs: any[]): any[] {
  if (runs.length === 0) return [];

  const avgSpeed = runs.reduce((s: number, r: any) => s + (r.averageSpeed || 0), 0) / runs.length;
  const candidates = new Set<number>();

  const intervalKeywords = /interval|fractionn|vma|piste|track|tempo|seuil|r[eé]p[eé]t/i;

  for (const run of runs) {
    // Interval-like: short + fast, or name matches
    if (run.distance < 10000 && run.averageSpeed > avgSpeed * 1.05) {
      candidates.add(run.activityId);
    }
    if (intervalKeywords.test(run.activityName || '')) {
      candidates.add(run.activityId);
    }

    // Race-like: distance close to a target (±5%)
    for (const t of TARGETS) {
      if (run.distance >= t.distance * 0.95 && run.distance <= t.distance * 1.05) {
        candidates.add(run.activityId);
      }
    }

    if (candidates.size >= 15) break;
  }

  // Also add top-N fastest runs by averageSpeed
  const sorted = [...runs].sort((a, b) => (b.averageSpeed || 0) - (a.averageSpeed || 0));
  for (const run of sorted.slice(0, 5)) {
    candidates.add(run.activityId);
    if (candidates.size >= 15) break;
  }

  return runs.filter((r: any) => candidates.has(r.activityId));
}

// Fetch activity details with caching
async function fetchActivityDetail(client: GarminConnect, activityId: number): Promise<any | null> {
  if (lapCache.has(activityId)) return lapCache.get(activityId);
  try {
    const detail: any = await client.getActivity({ activityId });
    lapCache.set(activityId, detail);
    return detail;
  } catch {
    return null;
  }
}

// Map raw splitSummaries to laps (same logic as activities.ts)
function extractLaps(splitSummaries: any[] | undefined): any[] {
  if (!splitSummaries || !Array.isArray(splitSummaries)) return [];
  const preferred = ['LAP_SPLIT', 'RUN_LAP_SPLIT', 'INTERVAL_SPLIT', 'KM_SPLIT'];
  for (const splitType of preferred) {
    const splits = splitSummaries.filter((s: any) => s.splitType === splitType);
    if (splits.length > 0) {
      return splits.map((s: any, i: number) => ({
        lapNumber: s.noOfSplits ?? i + 1,
        distance: s.distance ?? 0,
        duration: s.duration != null
          ? (s.duration > 100000 ? s.duration / 1000 : s.duration)
          : 0,
        averageSpeed: s.averageSpeed ?? 0,
      }));
    }
  }
  return [];
}

// Separate work laps from recovery laps using median pace
function getWorkLaps(laps: any[]): any[] {
  if (laps.length <= 1) return laps;

  const paces = laps
    .filter(l => l.distance > 0 && l.duration > 0)
    .map(l => l.duration / (l.distance / 1000)); // sec/km

  if (paces.length === 0) return laps;

  const sorted = [...paces].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Work laps: pace < median * 0.85 (significantly faster than median)
  return laps.filter(l => {
    if (l.distance <= 0 || l.duration <= 0) return false;
    const pace = l.duration / (l.distance / 1000);
    return pace < median * 0.85;
  });
}

// Sliding window: find best consecutive laps covering ≥90% of target distance
function bestSlidingWindow(laps: any[], targetDistance: number): { pace: number; time: number } | null {
  if (laps.length === 0) return null;

  const minDist = targetDistance * 0.9;
  let bestPace = Infinity;
  let bestTime = 0;

  for (let i = 0; i < laps.length; i++) {
    let dist = 0;
    let dur = 0;
    for (let j = i; j < laps.length; j++) {
      dist += laps[j].distance;
      dur += laps[j].duration;
      if (dist >= minDist) {
        const pace = dur / (dist / 1000);
        if (pace < bestPace) {
          bestPace = pace;
          bestTime = dur;
        }
        break; // extending further will only add slower laps
      }
    }
  }

  return bestPace < Infinity ? { pace: bestPace, time: bestTime } : null;
}

async function detectBestEfforts(client: GarminConnect, runs: any[]): Promise<BestEffort[]> {
  // Phase 1: Activity-level best efforts (same as before, baseline)
  const activityEfforts = new Map<string, BestEffort>();
  for (const target of TARGETS) {
    let bestPace = Infinity;
    let bestRun: any = null;
    for (const run of runs) {
      if (!run.distance || !run.duration || run.distance < target.distance * 0.9) continue;
      const pace = run.duration / (run.distance / 1000);
      if (pace < bestPace) {
        bestPace = pace;
        bestRun = run;
      }
    }
    if (bestRun) {
      activityEfforts.set(target.label, {
        distance: target.distance,
        label: target.label,
        time: bestPace * (target.distance / 1000),
        pace: bestPace,
        date: bestRun.startTimeLocal,
        activityId: bestRun.activityId,
        source: 'activity',
        confidence: 0.7,
      });
    }
  }

  // Phase 2: Fetch detailed laps for promising activities
  const candidates = selectCandidates(runs);
  console.log(`[stats] Fetching details for ${candidates.length} candidate activities`);

  const details = await Promise.all(
    candidates.map(c => fetchActivityDetail(client, c.activityId))
  );

  // Phase 3: Analyze laps for better efforts
  for (let idx = 0; idx < candidates.length; idx++) {
    const detail = details[idx];
    const run = candidates[idx];
    if (!detail) continue;

    const laps = extractLaps(detail.splitSummaries);
    if (laps.length <= 1) continue;

    const workLaps = getWorkLaps(laps);
    console.log(`[stats] Activity ${run.activityId} "${run.activityName}": ${laps.length} laps, ${workLaps.length} work laps`);

    for (const target of TARGETS) {
      // Try sliding window on work laps first, then all laps
      const fromWork = workLaps.length >= 2 ? bestSlidingWindow(workLaps, target.distance) : null;
      const fromAll = bestSlidingWindow(laps, target.distance);

      const lapResult = fromWork ?? fromAll;
      if (!lapResult) continue;

      const confidence = fromWork ? 0.9 : 0.75;
      const existing = activityEfforts.get(target.label);

      if (!existing || lapResult.pace < existing.pace) {
        activityEfforts.set(target.label, {
          distance: target.distance,
          label: target.label,
          time: lapResult.pace * (target.distance / 1000),
          pace: lapResult.pace,
          date: run.startTimeLocal,
          activityId: run.activityId,
          source: 'laps',
          confidence,
        });
        console.log(`[stats] New best ${target.label} from laps: ${Math.floor(lapResult.pace / 60)}:${String(Math.floor(lapResult.pace % 60)).padStart(2, '0')}/km (activity ${run.activityId})`);
      }
    }
  }

  return Array.from(activityEfforts.values());
}

export default router;
