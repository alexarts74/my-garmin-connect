import { Router } from 'express';
import { getClient } from './auth';

const router = Router();

// ── Training Load & Recovery ─────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const now = new Date();
    const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);

    // Fetch activities and health data in parallel
    const [activities, heartRate, sleep, userSettings] = await Promise.all([
      client.getActivities(0, 200),
      client.getHeartRate(now).catch(() => null),
      client.getSleepData(now).catch(() => null),
      client.getUserSettings().catch(() => null),
    ]);

    // Filter running activities in the last 42 days
    const runs = activities.filter((a: any) => {
      if (a.activityType?.typeKey !== 'running') return false;
      const d = new Date(a.startTimeLocal);
      return d >= sixWeeksAgo;
    });

    // Get max HR for TRIMP calculation (use 220-age estimate or Garmin data)
    const maxHR = (heartRate as any)?.maxHeartRate ?? 190;
    const restingHR = (heartRate as any)?.restingHeartRate ?? 60;

    // Calculate TRIMP for each run
    const trimpData: { date: string; trimp: number }[] = [];
    for (const run of runs as any[]) {
      const duration = run.duration || 0; // seconds
      const avgHR = run.averageHR || 0;

      if (duration <= 0 || avgHR <= 0) continue;

      const durationMin = duration / 60;
      const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
      const clampedHRR = Math.max(0, Math.min(1, hrReserve));

      // TRIMP = duration(min) × HRreserve × 0.64 × e^(1.92 × HRreserve)
      const trimp = durationMin * clampedHRR * 0.64 * Math.exp(1.92 * clampedHRR);

      trimpData.push({
        date: new Date(run.startTimeLocal).toISOString().slice(0, 10),
        trimp: Math.round(trimp * 10) / 10,
      });
    }

    // Calculate daily TRIMP totals
    const dailyTrimp = new Map<string, number>();
    for (const t of trimpData) {
      dailyTrimp.set(t.date, (dailyTrimp.get(t.date) || 0) + t.trimp);
    }

    // Calculate ATL (7-day exponentially weighted) and CTL (42-day exponentially weighted)
    const days = 42;
    const today = new Date();
    const atlDecay = 2 / (7 + 1);
    const ctlDecay = 2 / (42 + 1);

    let atl = 0;
    let ctl = 0;

    const history: { date: string; atl: number; ctl: number; tsb: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const dayTrimp = dailyTrimp.get(key) || 0;

      atl = atl * (1 - atlDecay) + dayTrimp * atlDecay;
      ctl = ctl * (1 - ctlDecay) + dayTrimp * ctlDecay;
      const tsb = ctl - atl;

      history.push({
        date: key,
        atl: Math.round(atl * 10) / 10,
        ctl: Math.round(ctl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
      });
    }

    const currentATL = history[history.length - 1]?.atl ?? 0;
    const currentCTL = history[history.length - 1]?.ctl ?? 0;
    const currentTSB = history[history.length - 1]?.tsb ?? 0;

    // Sleep quality factor
    const sleepScore = (sleep as any)?.dailySleepDTO?.sleepScores?.overall?.value ?? null;
    const avgOvernightHrv = (sleep as any)?.dailySleepDTO?.averageOvernightHrv ?? null;

    // Compute recovery score (0-100)
    let recoveryScore = 50; // baseline
    let factors: string[] = [];

    // TSB factor: positive = fresh, negative = fatigued
    if (currentTSB > 10) {
      recoveryScore += 20;
      factors.push('Bonne balance d\'entraînement');
    } else if (currentTSB > 0) {
      recoveryScore += 10;
      factors.push('Balance légèrement positive');
    } else if (currentTSB > -10) {
      recoveryScore -= 5;
      factors.push('Charge d\'entraînement modérée');
    } else {
      recoveryScore -= 15;
      factors.push('Charge d\'entraînement élevée');
    }

    // Sleep factor
    if (sleepScore != null) {
      if (sleepScore >= 80) {
        recoveryScore += 15;
        factors.push(`Excellent sommeil (${sleepScore})`);
      } else if (sleepScore >= 60) {
        recoveryScore += 5;
        factors.push(`Sommeil correct (${sleepScore})`);
      } else {
        recoveryScore -= 10;
        factors.push(`Sommeil insuffisant (${sleepScore})`);
      }
    }

    // HRV factor
    if (avgOvernightHrv != null && avgOvernightHrv > 0) {
      // We don't have a baseline, so just check if it's in a reasonable range
      if (avgOvernightHrv > 50) {
        recoveryScore += 10;
        factors.push(`HRV élevée (${avgOvernightHrv} ms)`);
      } else if (avgOvernightHrv > 30) {
        recoveryScore += 0;
      } else {
        recoveryScore -= 10;
        factors.push(`HRV basse (${avgOvernightHrv} ms)`);
      }
    }

    // Resting HR factor
    const currentRestingHR = (heartRate as any)?.restingHeartRate ?? null;
    const avgRestingHR = (heartRate as any)?.lastSevenDaysAvgRestingHeartRate ?? null;
    if (currentRestingHR && avgRestingHR && avgRestingHR > 0) {
      const hrDiff = ((currentRestingHR - avgRestingHR) / avgRestingHR) * 100;
      if (hrDiff > 10) {
        recoveryScore -= 10;
        factors.push(`FC repos élevée (+${Math.round(hrDiff)}% vs moy.)`);
      } else if (hrDiff < -5) {
        recoveryScore += 5;
        factors.push('FC repos basse — bonne récupération');
      }
    }

    recoveryScore = Math.max(0, Math.min(100, recoveryScore));

    // Readiness label
    let readinessLabel: string;
    let readinessLevel: 'high' | 'moderate' | 'low';
    if (recoveryScore >= 70) {
      readinessLabel = 'Prêt à performer';
      readinessLevel = 'high';
    } else if (recoveryScore >= 40) {
      readinessLabel = 'Entraînement léger';
      readinessLevel = 'moderate';
    } else {
      readinessLabel = 'Jour de repos';
      readinessLevel = 'low';
    }

    // Generate insights
    const insights = generateInsights(currentATL, currentCTL, currentTSB, sleepScore, avgOvernightHrv, runs as any[]);

    res.json({
      currentATL,
      currentCTL,
      currentTSB,
      recoveryScore,
      readinessLabel,
      readinessLevel,
      factors,
      insights,
      history,
      sleepScore,
      avgOvernightHrv,
      restingHR: currentRestingHR,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to compute training load';
    res.status(500).json({ error: message });
  }
});

function generateInsights(
  atl: number,
  ctl: number,
  tsb: number,
  sleepScore: number | null,
  hrv: number | null,
  runs: any[],
): string[] {
  const insights: string[] = [];

  // Days since last run
  if (runs.length > 0) {
    const lastRun = new Date(runs[0].startTimeLocal);
    const daysSince = Math.floor((Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3 && sleepScore != null && sleepScore >= 70) {
      insights.push(`${daysSince} jours sans courir + bon sommeil → tu es frais pour une sortie intense`);
    } else if (daysSince === 0 && tsb < -10) {
      insights.push('Tu as couru aujourd\'hui et ta charge est élevée — pense à récupérer demain');
    }
  }

  // ATL vs CTL
  if (atl > ctl * 1.5 && ctl > 0) {
    insights.push('Ta charge aiguë est bien supérieure à ta charge chronique — risque de surmenage');
  }

  // HRV insight
  if (hrv != null && hrv < 25) {
    insights.push(`Ton HRV est basse (${hrv} ms) → privilégie le repos ou une sortie facile`);
  }

  // Sleep insight
  if (sleepScore != null && sleepScore < 50) {
    insights.push('Mauvaise nuit de sommeil — ajuste l\'intensité en conséquence');
  }

  if (insights.length === 0) {
    if (tsb >= 0) {
      insights.push('Bonne forme générale — continue comme ça !');
    } else {
      insights.push('Charge d\'entraînement soutenue — surveille ta récupération');
    }
  }

  return insights;
}

export default router;
