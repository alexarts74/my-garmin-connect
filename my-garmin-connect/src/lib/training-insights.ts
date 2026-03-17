import type { TrainingLoadData } from '@/types/training-load';

export function getReadinessColor(level: TrainingLoadData['readinessLevel']): string {
  switch (level) {
    case 'high':
      return '#2ECC71';
    case 'moderate':
      return '#F39C12';
    case 'low':
      return '#E74C3C';
  }
}

export function getReadinessEmoji(level: TrainingLoadData['readinessLevel']): string {
  switch (level) {
    case 'high':
      return '🟢';
    case 'moderate':
      return '🟡';
    case 'low':
      return '🔴';
  }
}

export function formatTSB(tsb: number): string {
  if (tsb > 0) return `+${tsb.toFixed(1)}`;
  return tsb.toFixed(1);
}
