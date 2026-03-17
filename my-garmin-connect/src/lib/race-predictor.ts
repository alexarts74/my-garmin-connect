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

export function predictRaceTimes(bestEfforts: BestEffort[], vo2Max?: number | null): RacePrediction[] {
  if (bestEfforts.length === 0) return [];

  // Use the best available effort (prefer longer distances for accuracy)
  const sortedEfforts = [...bestEfforts].sort((a, b) => b.distance - a.distance);
  const reference = sortedEfforts[0];

  const predictions: RacePrediction[] = [];

  for (const race of RACE_DISTANCES) {
    // Use Riegel for primary prediction
    const riegelTime = riegelPredict(reference.time, reference.distance, race.distance);

    // If we have a VDOT estimate, blend it
    let predictedTime = riegelTime;
    if (vo2Max && vo2Max > 0) {
      const vdotTime = vdotPredictTime(vo2Max, race.distance);
      // Blend: 60% Riegel, 40% VDOT
      predictedTime = riegelTime * 0.6 + vdotTime * 0.4;
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
