import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DailyActivity } from '@/types/trends';

interface CalendarHeatmapProps {
  data: DailyActivity[];
  weeks: number;
}

const DAY_SIZE = 14;
const DAY_GAP = 3;
const DAYS_LABELS = ['L', '', 'M', '', 'V', '', 'D'];

export function CalendarHeatmap({ data, weeks }: CalendarHeatmapProps) {
  const colors = useTheme();

  // Build a map of date → distance
  const distanceMap = new Map<string, number>();
  let maxDistance = 0;
  for (const d of data) {
    distanceMap.set(d.date, d.distance);
    if (d.distance > maxDistance) maxDistance = d.distance;
  }

  // Generate grid: weeks × 7 days
  const today = new Date();
  const grid: { date: string; level: number }[][] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekDays: { date: string; level: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + (6 - d);
      const date = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      const distance = distanceMap.get(key) || 0;
      const level = maxDistance > 0
        ? Math.min(4, Math.ceil((distance / maxDistance) * 4))
        : 0;
      weekDays.push({ date: key, level });
    }
    grid.push(weekDays);
  }

  const levelColors = [
    colors.backgroundElement,
    colors.accent + '30',
    colors.accent + '60',
    colors.accent + '99',
    colors.accent,
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={styles.title}>
        Calendrier
      </ThemedText>
      <View style={styles.grid}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {DAYS_LABELS.map((label, i) => (
            <ThemedText key={i} style={styles.dayLabel} themeColor="textSecondary">
              {label}
            </ThemedText>
          ))}
        </View>
        {/* Weeks */}
        <View style={styles.weeks}>
          {grid.map((week, wi) => (
            <View key={wi} style={styles.weekColumn}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.dayCell,
                    { backgroundColor: levelColors[day.level] },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
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
    gap: DAY_GAP,
  },
  dayLabels: {
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  dayLabel: {
    fontSize: 10,
    height: DAY_SIZE,
    lineHeight: DAY_SIZE,
    width: 14,
  },
  weeks: {
    flexDirection: 'row',
    gap: DAY_GAP,
    flex: 1,
  },
  weekColumn: {
    gap: DAY_GAP,
    flex: 1,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: 3,
  },
});
