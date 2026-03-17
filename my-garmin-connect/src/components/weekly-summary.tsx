import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { formatDistance, formatDuration } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyStats } from '@/types/health';

interface WeeklySummaryProps {
  stats: WeeklyStats;
}

function formatWeeklyPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0) return '--:--';
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.floor(secondsPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function StatBlock({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const colors = useTheme();
  return (
    <View style={styles.statBlock}>
      <ThemedText style={[accent ? styles.statValueHero : styles.statValue, accent && { color: colors.accent }]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export function WeeklySummary({ stats }: WeeklySummaryProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" style={[styles.title, { color: colors.accent }]}>
        Cette semaine
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.grid}>
        <StatBlock
          value={formatDistance(stats.totalDistance)}
          label="Distance"
          accent
        />
        <StatBlock
          value={String(stats.runCount)}
          label="Courses"
        />
        <StatBlock
          value={formatDuration(stats.totalDuration)}
          label="Duree"
        />
        <StatBlock
          value={`${formatWeeklyPace(stats.averagePace)} /km`}
          label="Allure moy."
        />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  title: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statBlock: {
    width: '45%',
    gap: Spacing.half,
  },
  statValueHero: {
    fontSize: 24,
    fontFamily: Fonts.mono,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
  },
});
