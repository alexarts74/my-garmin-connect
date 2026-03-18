import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatChartDate } from '@/lib/training-insights';
import type { MetricDataPoint } from '@/types/health';

interface MetricEvolutionChartProps {
  data: MetricDataPoint[];
  title: string;
  unit?: string;
  description?: string;
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function MetricEvolutionChart({
  data,
  title,
  unit,
  description,
  color,
  height = 150,
  formatValue,
}: MetricEvolutionChartProps) {
  const colors = useTheme();
  const chartColor = color ?? colors.accent;

  if (data.length < 2) return null;

  // Map data to chart format with labels every 7 days
  const chartData = data.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? formatChartDate(d.date) : '',
  }));

  // Auto-compute Y bounds with 10% padding
  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin || 10;
  const yMin = Math.floor(rawMin - range * 0.1);
  const yMax = Math.ceil(rawMax + range * 0.1);

  // Compute spacing based on available width (~300px usable)
  const spacing = Math.max(4, Math.min(12, Math.floor(280 / data.length)));

  // Latest value display
  const latest = data[data.length - 1];
  const displayValue = formatValue ? formatValue(latest.value) : `${latest.value}`;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="smallBold" style={[styles.title, { color: colors.accent }]}>
            {title}
          </ThemedText>
          {description && (
            <ThemedText type="small" themeColor="textSecondary">
              {description}
            </ThemedText>
          )}
        </View>
        <ThemedText style={[styles.latestValue, { color: chartColor }]}>
          {displayValue}{unit ? ` ${unit}` : ''}
        </ThemedText>
      </View>
      <LineChart
        data={chartData}
        color={chartColor}
        height={height}
        maxValue={yMax}
        mostNegativeValue={yMin < 0 ? yMin : undefined}
        thickness={2}
        spacing={spacing}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        curved
        hideDataPoints
        areaChart
        startFillColor={chartColor}
        startOpacity={0.15}
        endOpacity={0}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
        yAxisLabelSuffix={unit ? ` ${unit}` : ''}
        noOfSections={3}
        isAnimated
        animationDuration={300}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 14,
  },
  latestValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
});
