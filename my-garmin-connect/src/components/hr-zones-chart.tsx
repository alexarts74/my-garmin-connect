import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HRZone } from '@/types/healthkit';
import { formatDuration } from '@/lib/format';

const ZONE_COLORS = [
  '#3498db', // Z1 blue
  '#2ecc71', // Z2 green
  '#f1c40f', // Z3 yellow
  '#e67e22', // Z4 orange
  '#e74c3c', // Z5 red
];

interface HRZonesChartProps {
  zones: HRZone[];
}

export function HRZonesChart({ zones }: HRZonesChartProps) {
  const colors = useTheme();
  const maxPercentage = Math.max(...zones.map((z) => z.percentage), 1);

  return (
    <View style={styles.container}>
      {zones.map((zone) => (
        <View key={zone.zone} style={styles.row}>
          <View style={styles.labelCol}>
            <ThemedText style={[styles.zoneLabel, { color: ZONE_COLORS[zone.zone - 1] }]}>
              Z{zone.zone}
            </ThemedText>
            <ThemedText style={styles.bpmRange} themeColor="textSecondary">
              {zone.minBpm}-{zone.maxBpm}
            </ThemedText>
          </View>
          <View style={styles.barCol}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: ZONE_COLORS[zone.zone - 1],
                  width: `${Math.max((zone.percentage / maxPercentage) * 100, 2)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.valueCol}>
            <ThemedText style={styles.percentage}>{zone.percentage}%</ThemedText>
            <ThemedText style={styles.duration} themeColor="textSecondary">
              {formatDuration(zone.durationSeconds)}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  labelCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  bpmRange: {
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
  barCol: {
    flex: 1,
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  valueCol: {
    width: 65,
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.mono,
  },
  duration: {
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
});
