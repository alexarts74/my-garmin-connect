import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatTime } from '@/lib/format';
import type { SleepLevel } from '@/types/health';

const LEVEL_COLORS: Record<string, string> = {
  deep: '#5B6FE6',
  light: '#7CB5F0',
  rem: '#A78BFA',
  awake: '#F87171',
};

function getLevelColor(activityLevel: number): string {
  // Garmin activityLevel mapping:
  // 0 = deep, 1 = light, 2 = REM, -1 or other = awake
  if (activityLevel === 0) return LEVEL_COLORS.deep;
  if (activityLevel === 1) return LEVEL_COLORS.light;
  if (activityLevel === 2) return LEVEL_COLORS.rem;
  return LEVEL_COLORS.awake;
}

interface SleepTimelineProps {
  sleepLevels: SleepLevel[];
  sleepStartTimestampGMT: number;
  sleepEndTimestampGMT: number;
}

export function SleepTimeline({
  sleepLevels,
  sleepStartTimestampGMT,
  sleepEndTimestampGMT,
}: SleepTimelineProps) {
  if (!sleepLevels.length || sleepEndTimestampGMT <= sleepStartTimestampGMT) return null;

  const totalDuration = sleepEndTimestampGMT - sleepStartTimestampGMT;
  const midTimestamp = sleepStartTimestampGMT + totalDuration / 2;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {sleepLevels.map((level, i) => {
          const start = new Date(level.startGMT).getTime();
          const end = new Date(level.endGMT).getTime();
          const segDuration = end - start;
          const pct = segDuration / totalDuration;
          if (pct <= 0) return null;
          return (
            <View
              key={i}
              style={[styles.segment, { flex: pct, backgroundColor: getLevelColor(level.activityLevel) }]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(sleepStartTimestampGMT)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(midTimestamp)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(sleepEndTimestampGMT)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  bar: {
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  segment: {
    height: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
