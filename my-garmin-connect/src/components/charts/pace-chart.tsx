import React from 'react';
import { StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyTrendData } from '@/types/trends';

interface PaceChartProps {
  data: WeeklyTrendData[];
}

function formatPaceValue(secPerKm: number): string {
  if (secPerKm <= 0) return '--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function PaceChart({ data }: PaceChartProps) {
  const colors = useTheme();

  const filtered = data.filter((w) => w.averagePace > 0);

  const lineData = filtered.map((week) => ({
    value: week.averagePace / 60, // convert to minutes for chart scale
    label: formatWeekLabel(week.weekStart),
    dataPointText: formatPaceValue(week.averagePace),
  }));

  if (lineData.length < 2) return null;

  const values = lineData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={styles.title}>
        Allure moyenne (/km)
      </ThemedText>
      <LineChart
        data={lineData}
        color={colors.accent}
        dataPointsColor={colors.accent}
        thickness={2}
        spacing={50}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        curved
        areaChart
        startFillColor={colors.accent}
        startOpacity={0.2}
        endOpacity={0}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        maxValue={maxVal * 1.05}
        mostNegativeValue={minVal * 0.95}
        isAnimated
        animationDuration={300}
        pointerConfig={{
          pointerStripColor: colors.textSecondary,
          pointerStripWidth: 1,
          pointerColor: colors.accent,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 30,
          pointerLabelComponent: (items: any[]) => (
            <ThemedView type="backgroundElement" style={styles.tooltip}>
              <ThemedText style={styles.tooltipText}>
                {items[0]?.dataPointText ?? ''}
              </ThemedText>
            </ThemedView>
          ),
        }}
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
  tooltip: {
    padding: 6,
    borderRadius: 8,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
