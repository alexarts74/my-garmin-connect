import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyTrendData } from '@/types/trends';
import { formatDistance, formatDuration } from '@/lib/format';

interface WeekComparisonProps {
  data: WeeklyTrendData[];
}

function ComparisonStat({
  label,
  current,
  previous,
  formatter,
}: {
  label: string;
  current: number;
  previous: number;
  formatter: (v: number) => string;
}) {
  const colors = useTheme();
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isUp = diff > 0;
  const arrow = diff === 0 ? '' : isUp ? '↑' : '↓';
  const diffColor = diff === 0 ? colors.textSecondary : isUp ? '#2ECC71' : '#E74C3C';

  return (
    <View style={styles.statBlock}>
      <ThemedText style={styles.statValue}>{formatter(current)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {previous > 0 && (
        <ThemedText style={[styles.diff, { color: diffColor }]}>
          {arrow} {Math.abs(diff).toFixed(0)}%
        </ThemedText>
      )}
    </View>
  );
}

export function WeekComparison({ data }: WeekComparisonProps) {
  if (data.length < 2) return null;

  const current = data[data.length - 1];
  const previous = data[data.length - 2];

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={styles.title}>
        Cette semaine vs précédente
      </ThemedText>
      <View style={styles.grid}>
        <ComparisonStat
          label="Distance"
          current={current.totalDistance}
          previous={previous.totalDistance}
          formatter={formatDistance}
        />
        <ComparisonStat
          label="Courses"
          current={current.runCount}
          previous={previous.runCount}
          formatter={(v) => String(v)}
        />
        <ComparisonStat
          label="Durée"
          current={current.totalDuration}
          previous={previous.totalDuration}
          formatter={formatDuration}
        />
        <ComparisonStat
          label="Allure"
          current={current.averagePace}
          previous={previous.averagePace}
          formatter={(v) => {
            if (v <= 0) return '--';
            const min = Math.floor(v / 60);
            const sec = Math.floor(v % 60);
            return `${min}:${sec.toString().padStart(2, '0')}/km`;
          }}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statBlock: {
    width: '45%',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  diff: {
    fontSize: 12,
    fontWeight: '600',
  },
});
