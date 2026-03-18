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

/** Returns a qualitative label for ATL/CTL TRIMP values */
export function getLoadLevel(value: number): string {
  if (value < 10) return 'Faible';
  if (value < 25) return 'Modéré';
  if (value < 45) return 'Élevé';
  return 'Très élevé';
}

const MONTHS_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];

/** Formats a "YYYY-MM-DD" date string to a short label like "5 mar" */
export function formatChartDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const day = parseInt(d, 10);
  const month = MONTHS_SHORT[parseInt(m, 10) - 1];
  return `${day} ${month}`;
}
