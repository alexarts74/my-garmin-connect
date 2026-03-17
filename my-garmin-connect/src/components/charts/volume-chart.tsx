import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyTrendData } from '@/types/trends';

interface VolumeChartProps {
  data: WeeklyTrendData[];
  mode: 'distance' | 'duration';
}

export function VolumeChart({ data, mode }: VolumeChartProps) {
  const colors = useTheme();

  const barData = data.map((week, i) => {
    const value = mode === 'distance'
      ? week.totalDistance / 1000 // km
      : week.totalDuration / 3600; // hours
    const isLast = i === data.length - 1;

    return {
      value,
      label: formatWeekLabel(week.weekStart),
      frontColor: isLast ? colors.accent : colors.backgroundSelected,
      topLabelComponent: () => (
        <ThemedText style={[styles.barLabel, { color: colors.textSecondary }]}>
          {mode === 'distance' ? `${value.toFixed(1)}` : `${value.toFixed(1)}`}
        </ThemedText>
      ),
    };
  });

  const maxValue = Math.max(...barData.map((d) => d.value), 1);

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={styles.title}>
        {mode === 'distance' ? 'Volume (km)' : 'Durée (heures)'}
      </ThemedText>
      <BarChart
        data={barData}
        barWidth={28}
        spacing={12}
        roundedTop
        roundedBottom
        noOfSections={4}
        maxValue={maxValue * 1.2}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        isAnimated
        animationDuration={300}
      />
    </ThemedView>
  );
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  return `${d.getDate()}/${d.getMonth() + 1}`;
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
  barLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    marginBottom: 2,
  },
});
