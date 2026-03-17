import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRaceTime, predictRaceTimes } from '@/lib/race-predictor';
import type { BestEffort } from '@/types/trends';

interface RacePredictionsProps {
  bestEfforts: BestEffort[];
  vo2Max?: number | null;
}

const DISTANCE_ICONS: Record<string, string> = {
  '5K': '5',
  '10K': '10',
  'Semi-marathon': '21',
  'Marathon': '42',
};

function PredictionCard({
  label,
  time,
  pace,
}: {
  label: string;
  time: number;
  pace: number;
}) {
  const colors = useTheme();
  const km = DISTANCE_ICONS[label] || '';
  const paceMin = Math.floor(pace / 60);
  const paceSec = Math.floor(pace % 60);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
          {km}K
        </ThemedText>
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={[styles.time, { color: colors.accent }]}>
          {formatRaceTime(time)}
        </ThemedText>
        <ThemedText style={styles.pace} themeColor="textSecondary">
          {paceMin}:{paceSec.toString().padStart(2, '0')} /km
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export function RacePredictions({ bestEfforts, vo2Max }: RacePredictionsProps) {
  const predictions = predictRaceTimes(bestEfforts, vo2Max);

  if (predictions.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.empty}>
        <ThemedText type="small" themeColor="textSecondary">
          Pas assez de données pour prédire des temps de course.
          Continue à courir !
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {predictions.map((p) => (
          <PredictionCard
            key={p.label}
            label={p.label}
            time={p.predictedTime}
            pace={p.predictedPace}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    width: '48%',
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.mono,
  },
  cardContent: {
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  pace: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  empty: {
    borderRadius: 14,
    padding: Spacing.four,
    alignItems: 'center',
  },
});
