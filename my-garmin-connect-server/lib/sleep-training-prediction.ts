import { ComputedSleepScores } from './sleep-scoring';

export interface TrainingPrediction {
  recommendedIntensity: 'high' | 'moderate' | 'easy' | 'rest';
  intensityLabel: string;
  maxRecommendedDuration: number; // minutes
  warnings: string[];
  positives: string[];
  recoveryQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recoveryDetail: string;
}

const INTENSITY_LABELS: Record<string, string> = {
  high: 'Haute intensité',
  moderate: 'Intensité modérée',
  easy: 'Sortie facile',
  rest: 'Repos',
};

export function generateTrainingPrediction(scores: ComputedSleepScores): TrainingPrediction {
  const warnings: string[] = [];
  const positives: string[] = [];

  // Collect warnings
  if (scores.deep.score < 40) {
    warnings.push('Récupération musculaire compromise — sommeil profond insuffisant');
  }
  if (scores.rem.score < 40) {
    warnings.push('Consolidation mémoire motrice affectée — REM insuffisant');
  }
  if (scores.awake.score < 40) {
    warnings.push('Sommeil fragmenté — trop de temps éveillé');
  }
  if (scores.stress.score < 40 && scores.stress.score > 0) {
    warnings.push('Stress élevé pendant le sommeil');
  }
  if (scores.hrv.score < 40 && scores.hrv.score > 0) {
    warnings.push('Système nerveux encore en récupération — HRV faible');
  }
  if (scores.duration.score < 40) {
    warnings.push('Durée de sommeil insuffisante');
  }

  // Collect positives
  if (scores.deep.score >= 70) {
    positives.push('Bonne récupération musculaire');
  }
  if (scores.rem.score >= 70) {
    positives.push('Bonne consolidation mémoire motrice');
  }
  if (scores.hrv.score >= 70) {
    positives.push('Système nerveux bien récupéré');
  }
  if (scores.duration.score >= 80) {
    positives.push('Durée de sommeil optimale');
  }
  if (scores.stress.score >= 70) {
    positives.push('Niveau de stress nocturne bas');
  }
  if (scores.awake.score >= 80) {
    positives.push('Sommeil continu, peu de réveils');
  }

  // Determine intensity
  const overall = scores.overall.score;
  const hasCriticalLow = scores.deep.score < 30 || scores.rem.score < 30 || scores.hrv.score < 30;
  const anyBelow40 = [scores.deep, scores.rem, scores.awake, scores.stress, scores.hrv, scores.duration]
    .some(s => s.score < 40 && s.score > 0);

  let recommendedIntensity: TrainingPrediction['recommendedIntensity'];
  let maxRecommendedDuration: number;

  if (overall < 40 || (scores.stress.score > 0 && scores.stress.score < 30)) {
    recommendedIntensity = 'rest';
    maxRecommendedDuration = 0;
  } else if (overall < 60 || hasCriticalLow) {
    recommendedIntensity = 'easy';
    maxRecommendedDuration = 40;
  } else if (overall >= 80 && scores.hrv.score >= 70 && !anyBelow40) {
    recommendedIntensity = 'high';
    maxRecommendedDuration = 90;
  } else {
    recommendedIntensity = 'moderate';
    maxRecommendedDuration = 60;
  }

  // Recovery quality
  let recoveryQuality: TrainingPrediction['recoveryQuality'];
  let recoveryDetail: string;

  if (overall >= 85) {
    recoveryQuality = 'excellent';
    recoveryDetail = 'Récupération excellente — votre corps est prêt pour un effort soutenu';
  } else if (overall >= 65) {
    recoveryQuality = 'good';
    recoveryDetail = 'Bonne récupération — entraînement normal possible';
  } else if (overall >= 45) {
    recoveryQuality = 'fair';
    recoveryDetail = 'Récupération moyenne — privilégiez un effort modéré';
  } else {
    recoveryQuality = 'poor';
    recoveryDetail = 'Récupération insuffisante — le repos est recommandé';
  }

  return {
    recommendedIntensity,
    intensityLabel: INTENSITY_LABELS[recommendedIntensity],
    maxRecommendedDuration,
    warnings,
    positives,
    recoveryQuality,
    recoveryDetail,
  };
}
