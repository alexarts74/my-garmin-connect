import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ScoreDetail } from '@/types/health';

interface SleepScoreCardProps {
  label: string;
  score: ScoreDetail;
}

function scoreColor(score: number): string {
  if (score >= 85) return '#10B981';
  if (score >= 65) return '#34D399';
  if (score >= 45) return '#F59E0B';
  return '#F87171';
}

export function SleepScoreCard({ label, score }: SleepScoreCardProps) {
  const colors = useTheme();
  const color = scoreColor(score.score);

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSelected }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.scoreRow}>
        <ThemedText style={[styles.scoreValue, { color }]}>
          {score.score}
        </ThemedText>
        <ThemedText style={[styles.scoreLabel, { color }]}>
          {score.label}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detail} numberOfLines={2}>
        {score.detail}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
    overflow: 'visible',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    overflow: 'visible',
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: Fonts.mono,
    lineHeight: 34,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  detail: {
    fontSize: 11,
    lineHeight: 15,
  },
});
