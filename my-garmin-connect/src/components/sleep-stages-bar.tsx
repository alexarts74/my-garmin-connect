import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { formatSleepDuration } from '@/lib/format';

const COLORS = {
  deep: '#5B6FE6',
  light: '#7CB5F0',
  rem: '#A78BFA',
  awake: '#F87171',
};

interface SleepStagesBarProps {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export function SleepStagesBar({ deep, light, rem, awake }: SleepStagesBarProps) {
  const total = deep + light + rem + awake;
  if (total <= 0) return null;

  const stages = [
    { key: 'deep', label: 'Profond', seconds: deep, color: COLORS.deep },
    { key: 'light', label: 'Léger', seconds: light, color: COLORS.light },
    { key: 'rem', label: 'REM', seconds: rem, color: COLORS.rem },
    { key: 'awake', label: 'Éveillé', seconds: awake, color: COLORS.awake },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {stages.map((s) => {
          const pct = s.seconds / total;
          if (pct <= 0) return null;
          return (
            <View
              key={s.key}
              style={[styles.segment, { flex: pct, backgroundColor: s.color }]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {stages.map((s) => {
          const pct = Math.round((s.seconds / total) * 100);
          return (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <View style={styles.legendText}>
                <ThemedText type="small" themeColor="textSecondary">
                  {s.label}
                </ThemedText>
                <ThemedText style={styles.legendValue}>
                  {formatSleepDuration(s.seconds)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {pct}%
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  bar: {
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  legendText: {
    gap: 1,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: Fonts.mono,
  },
});
