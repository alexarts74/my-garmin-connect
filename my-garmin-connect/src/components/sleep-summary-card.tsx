import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSleepDuration } from '@/lib/format';
import type { SleepDetail } from '@/types/health';

const STAGE_COLORS = {
  deep: '#5B6FE6',
  light: '#7CB5F0',
  rem: '#A78BFA',
  awake: '#F87171',
};

function qualifierColor(key: string | undefined, accent: string): string {
  switch (key?.toUpperCase()) {
    case 'EXCELLENT': return '#10B981';
    case 'GOOD': return accent;
    case 'FAIR': return '#F59E0B';
    case 'POOR': return '#F87171';
    default: return accent;
  }
}

interface SleepSummaryCardProps {
  sleep: SleepDetail;
}

export function SleepSummaryCard({ sleep }: SleepSummaryCardProps) {
  const colors = useTheme();
  const router = useRouter();

  const overallQualifier = sleep.sleepScores?.overall?.qualifierKey;
  const scoreColor = qualifierColor(overallQualifier, colors.accent);
  const total = sleep.deepSleepSeconds + sleep.lightSleepSeconds + sleep.remSleepSeconds + sleep.awakeSleepSeconds;

  const stages = [
    { key: 'deep', seconds: sleep.deepSleepSeconds, color: STAGE_COLORS.deep },
    { key: 'light', seconds: sleep.lightSleepSeconds, color: STAGE_COLORS.light },
    { key: 'rem', seconds: sleep.remSleepSeconds, color: STAGE_COLORS.rem },
    { key: 'awake', seconds: sleep.awakeSleepSeconds, color: STAGE_COLORS.awake },
  ];

  return (
    <Pressable
      onPress={() => router.push('/(dashboard)/sleep')}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="smallBold" style={{ color: colors.accent }}>
              Sommeil
            </ThemedText>
            <ThemedText style={[styles.arrow, { color: colors.textSecondary }]}>
              ›
            </ThemedText>
          </View>
        </View>

        <View style={styles.mainRow}>
          {/* Score */}
          {sleep.sleepScore > 0 && (
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
              <ThemedText style={[styles.scoreText, { color: scoreColor }]}>
                {sleep.sleepScore}
              </ThemedText>
            </View>
          )}

          {/* Duration */}
          <View style={styles.durationSection}>
            <ThemedText style={styles.durationValue}>
              {formatSleepDuration(sleep.sleepTimeSeconds)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              de sommeil
            </ThemedText>
          </View>
        </View>

        {/* Mini stages bar */}
        {total > 0 && (
          <View style={styles.miniBar}>
            {stages.map((s) => {
              const pct = s.seconds / total;
              if (pct <= 0) return null;
              return (
                <View
                  key={s.key}
                  style={[styles.miniSegment, { flex: pct, backgroundColor: s.color }]}
                />
              );
            })}
          </View>
        )}

        {/* Stage percentages */}
        {total > 0 && (
          <View style={styles.stagesRow}>
            {stages.filter(s => s.seconds > 0).map((s) => (
              <View key={s.key} style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: s.color }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round((s.seconds / total) * 100)}%
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    fontFamily: Fonts.regular,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  durationSection: {
    gap: 2,
    overflow: 'visible',
  },
  durationValue: {
    fontSize: 22,
    fontFamily: Fonts.mono,
  },
  miniBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  miniSegment: {
    height: '100%',
  },
  stagesRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
