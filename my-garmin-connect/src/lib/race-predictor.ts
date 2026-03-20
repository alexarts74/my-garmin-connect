import type { BestEffort } from '@/types/trends';

export interface RacePrediction {
  distance: number; // meters
  label: string;
  predictedTime: number; // seconds
  predictedPace: number; // sec/km
}

const RACE_DISTANCES = [
  { label: '5K', distance: 5000 },
  { label: '10K', distance: 10000 },
  { label: 'Semi-marathon', distance: 21097.5 },
  { label: 'Marathon', distance: 42195 },
];

/**
 * Riegel formula: T2 = T1 × (D2/D1)^1.06
 * Predicts race time for a longer distance based on a known effort.
 */
function riegelPredict(knownTime: number, knownDistance: number, targetDistance: number): number {
  return knownTime * Math.pow(targetDistance / knownDistance, 1.06);
}

/**
 * VDOT-based prediction using Jack Daniels' approximation.
 * First estimates VDOT from a known performance, then predicts other distances.
 */
function estimateVDOT(time: number, distance: number): number {
  // Simplified VDOT estimation
  // velocity in m/min
  const velocity = distance / (time / 60);
  // VO2 from velocity: VO2 = -4.60 + 0.182258 * v + 0.000104 * v^2
  const vo2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  // % VO2max from duration: %VO2max = 0.8 + 0.1894393 * e^(-0.012778 * t) + 0.2989558 * e^(-0.1932605 * t)
  const tMin = time / 60;
  const pctVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);
  return vo2 / pctVO2max;
}

function vdotPredictTime(vdot: number, distance: number): number {
  // Binary search for the time that gives this VDOT at this distance
  let lo = distance / 10; // fastest possible (10 m/s)
  let hi = distance / 1; // slowest (1 m/s)

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const estVdot = estimateVDOT(mid, distance);
    if (estVdot > vdot) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}

// Recency weight: how much to trust an effort based on age
function recencyWeight(dateStr: string): number {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const weeks = ageMs / (7 * 24 * 60 * 60 * 1000);
  if (weeks < 4) return 1.0;
  if (weeks < 8) return 0.9;
  if (weeks < 12) return 0.75;
  return 0.5;
}

export function predictRaceTimes(bestEfforts: BestEffort[], vo2Max?: number | null): RacePrediction[] {
  if (bestEfforts.length === 0) return [];

  const predictions: RacePrediction[] = [];

  for (const race of RACE_DISTANCES) {
    // Check for exact match first (effort at this distance)
    const exact = bestEfforts.find(
      e => e.distance >= race.distance * 0.95 && e.distance <= race.distance * 1.05
    );

    if (exact) {
      // Direct effort at this distance — use it as-is (adjusted for exact distance)
      const adjustedTime = exact.pace * (race.distance / 1000);
      predictions.push({
        distance: race.distance,
        label: race.label,
        predictedTime: Math.round(adjustedTime),
        predictedPace: Math.round(exact.pace),
      });
      continue;
    }

    // Collect predictions from all available efforts, weighted
    const weightedPredictions: { time: number; weight: number }[] = [];

    for (const effort of bestEfforts) {
      const riegelTime = riegelPredict(effort.time, effort.distance, race.distance);
      const confidence = effort.confidence ?? 0.7;
      const recency = recencyWeight(effort.date);

      // Prefer efforts closer in distance (shorter → extrapolate up is safer with Riegel)
      const distRatio = effort.distance / race.distance;
      let distanceWeight: number;
      if (distRatio <= 1) {
        // Shorter effort extrapolating up — good, closer is better
        distanceWeight = distRatio; // e.g., 5K→10K = 0.5, 10K→10K = 1.0
      } else {
        // Longer effort extrapolating down — less reliable
        distanceWeight = 1 / distRatio * 0.8;
      }

      const totalWeight = confidence * recency * distanceWeight;
      if (totalWeight > 0.05) {
        weightedPredictions.push({ time: riegelTime, weight: totalWeight });
      }
    }

    if (weightedPredictions.length === 0) continue;

    // Weighted average of all predictions
    const totalWeight = weightedPredictions.reduce((s, p) => s + p.weight, 0);
    let predictedTime = weightedPredictions.reduce((s, p) => s + p.time * p.weight, 0) / totalWeight;

    // Blend with VDOT if available (as fallback/sanity check)
    if (vo2Max && vo2Max > 0) {
      const vdotTime = vdotPredictTime(vo2Max, race.distance);
      // 70% weighted average, 30% VDOT
      predictedTime = predictedTime * 0.7 + vdotTime * 0.3;
    }

    predictions.push({
      distance: race.distance,
      label: race.label,
      predictedTime: Math.round(predictedTime),
      predictedPace: Math.round(predictedTime / (race.distance / 1000)),
    });
  }

  return predictions;
}

export function formatRaceTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}
