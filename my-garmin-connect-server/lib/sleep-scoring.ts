export interface SleepScoreInput {
  sleepTimeSeconds: number;
  deepSleepSeconds: number;
  lightSleepSeconds: number;
  remSleepSeconds: number;
  awakeSleepSeconds: number;
  avgSleepStress: number;
  avgOvernightHrv: number;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Bon';
  if (score >= 45) return 'Correct';
  return 'Mauvais';
}

/**
 * Score duration: 100 if between 7-9h, linear decay outside.
 * Below 4h or above 12h → 0.
 */
function scoreDuration(sleepTimeSeconds: number): ScoreDetail {
  const hours = sleepTimeSeconds / 3600;
  let score: number;

  if (hours >= 7 && hours <= 9) {
    score = 100;
  } else if (hours < 7) {
    // Linear from 0 at 4h to 100 at 7h
    score = clamp(((hours - 4) / 3) * 100, 0, 100);
  } else {
    // Linear from 100 at 9h to 0 at 12h
    score = clamp(((12 - hours) / 3) * 100, 0, 100);
  }

  score = Math.round(score);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  return {
    score,
    label: scoreLabel(score),
    detail: `${h}h${m.toString().padStart(2, '0')} — ${hours >= 7 && hours <= 9 ? 'optimal (7-9h)' : hours < 7 ? 'insuffisant' : 'excessif'}`,
  };
}

/**
 * Score a sleep stage percentage against an optimal range.
 */
function scorePercentage(
  stageSeconds: number,
  totalSeconds: number,
  optimalMin: number,
  optimalMax: number,
  stageName: string,
): ScoreDetail {
  if (totalSeconds <= 0) {
    return { score: 0, label: 'Mauvais', detail: 'Pas de données' };
  }

  const pct = (stageSeconds / totalSeconds) * 100;
  let score: number;

  if (pct >= optimalMin && pct <= optimalMax) {
    score = 100;
  } else if (pct < optimalMin) {
    // Linear decay: 0 when pct is 0
    score = clamp((pct / optimalMin) * 100, 0, 100);
  } else {
    // Linear decay above optimal
    const overRange = 100 - optimalMax;
    score = clamp(((100 - pct) / overRange) * 100, 0, 100);
  }

  score = Math.round(score);
  const inRange = pct >= optimalMin && pct <= optimalMax;

  return {
    score,
    label: scoreLabel(score),
    detail: `${pct.toFixed(0)}% — ${inRange ? `dans la norme (${optimalMin}-${optimalMax}%)` : pct < optimalMin ? 'insuffisant' : 'élevé'}`,
  };
}

function scoreAwake(awakeSleepSeconds: number, totalSeconds: number): ScoreDetail {
  if (totalSeconds <= 0) {
    return { score: 0, label: 'Mauvais', detail: 'Pas de données' };
  }

  const pct = (awakeSleepSeconds / totalSeconds) * 100;
  let score: number;

  if (pct <= 5) {
    score = 100;
  } else if (pct <= 15) {
    // Linear from 100 at 5% to 0 at 15%
    score = clamp(((15 - pct) / 10) * 100, 0, 100);
  } else {
    score = 0;
  }

  score = Math.round(score);
  return {
    score,
    label: scoreLabel(score),
    detail: `${pct.toFixed(0)}% — ${pct <= 5 ? 'optimal (< 5%)' : 'trop élevé'}`,
  };
}

function scoreStress(avgSleepStress: number): ScoreDetail {
  if (avgSleepStress <= 0) {
    return { score: 0, label: 'Mauvais', detail: 'Pas de données' };
  }

  let score: number;
  if (avgSleepStress <= 15) {
    score = 100;
  } else if (avgSleepStress <= 40) {
    score = clamp(((40 - avgSleepStress) / 25) * 100, 0, 100);
  } else {
    score = 0;
  }

  score = Math.round(score);
  return {
    score,
    label: scoreLabel(score),
    detail: `${avgSleepStress} — ${avgSleepStress <= 15 ? 'optimal (< 15)' : avgSleepStress <= 25 ? 'modéré' : 'élevé'}`,
  };
}

function scoreHrv(avgOvernightHrv: number): ScoreDetail {
  if (avgOvernightHrv <= 0) {
    return { score: 0, label: 'Mauvais', detail: 'Pas de données' };
  }

  let score: number;
  if (avgOvernightHrv >= 50) {
    score = 100;
  } else if (avgOvernightHrv >= 20) {
    score = clamp(((avgOvernightHrv - 20) / 30) * 100, 0, 100);
  } else {
    score = Math.round(clamp((avgOvernightHrv / 20) * 30, 0, 30));
  }

  score = Math.round(score);
  return {
    score,
    label: scoreLabel(score),
    detail: `${avgOvernightHrv} ms — ${avgOvernightHrv >= 50 ? 'optimal (> 50 ms)' : avgOvernightHrv >= 30 ? 'modéré' : 'faible'}`,
  };
}

export function computeSleepScores(input: SleepScoreInput): ComputedSleepScores {
  const totalSleep = input.deepSleepSeconds + input.lightSleepSeconds + input.remSleepSeconds + input.awakeSleepSeconds;

  const duration = scoreDuration(input.sleepTimeSeconds);
  const deep = scorePercentage(input.deepSleepSeconds, totalSleep, 15, 25, 'profond');
  const rem = scorePercentage(input.remSleepSeconds, totalSleep, 20, 25, 'REM');
  const light = scorePercentage(input.lightSleepSeconds, totalSleep, 45, 55, 'léger');
  const awake = scoreAwake(input.awakeSleepSeconds, totalSleep);
  const stress = scoreStress(input.avgSleepStress);
  const hrv = scoreHrv(input.avgOvernightHrv);

  // Weighted average
  const overallScore = Math.round(
    duration.score * 0.25 +
    deep.score * 0.20 +
    rem.score * 0.20 +
    awake.score * 0.15 +
    stress.score * 0.10 +
    hrv.score * 0.10,
  );

  return {
    overall: {
      score: overallScore,
      label: scoreLabel(overallScore),
      detail: `Score composite pondéré`,
    },
    duration,
    deep,
    rem,
    light,
    awake,
    stress,
    hrv,
  };
}
