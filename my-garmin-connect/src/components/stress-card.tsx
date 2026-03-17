import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { StressData } from '@/types/health';

const STRESS_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F87171',
};

function getStressColor(level: number): string {
  if (level <= 25) return STRESS_COLORS.low;
  if (level <= 50) return STRESS_COLORS.medium;
  return STRESS_COLORS.high;
}

function getStressLabel(qualifier: string): string {
  const map: Record<string, string> = {
    LOW: 'Bas',
    MEDIUM: 'Moyen',
    HIGH: 'Élevé',
    UNKNOWN: '--',
    REST: 'Repos',
  };
  return map[qualifier] ?? (qualifier || '--');
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? `${m}m` : ''}`;
  return `${m}m`;
}

interface StressCardProps {
  stress: StressData;
}

export function StressCard({ stress }: StressCardProps) {
  const colors = useTheme();
  const stressColor = getStressColor(stress.overallLevel);
  const totalDuration = stress.lowDurationSeconds + stress.mediumDurationSeconds + stress.highDurationSeconds;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={{ color: colors.accent }}>
        Stress
      </ThemedText>

      <View style={styles.mainRow}>
        <View style={[styles.scoreBadge, { backgroundColor: stressColor + '20' }]}>
          <SymbolView
            name={{ ios: 'brain.head.profile', android: 'psychology', web: 'psychology' }}
            size={24}
            tintColor={stressColor}
          />
        </View>

        <View style={styles.valueSection}>
          <View style={styles.levelRow}>
            <ThemedText style={[styles.levelValue, { color: stressColor }]}>
              {stress.overallLevel > 0 ? stress.overallLevel : '--'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {getStressLabel(stress.stressQualifier)}
            </ThemedText>
          </View>
          {stress.maxLevel > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Max {stress.maxLevel}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Stress distribution bar */}
      {totalDuration > 0 && (
        <View style={styles.distribution}>
          <View style={styles.bar}>
            {stress.lowDurationSeconds > 0 && (
              <View
                style={[styles.segment, {
                  flex: stress.lowDurationSeconds / totalDuration,
                  backgroundColor: STRESS_COLORS.low,
                }]}
              />
            )}
            {stress.mediumDurationSeconds > 0 && (
              <View
                style={[styles.segment, {
                  flex: stress.mediumDurationSeconds / totalDuration,
                  backgroundColor: STRESS_COLORS.medium,
                }]}
              />
            )}
            {stress.highDurationSeconds > 0 && (
              <View
                style={[styles.segment, {
                  flex: stress.highDurationSeconds / totalDuration,
                  backgroundColor: STRESS_COLORS.high,
                }]}
              />
            )}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: STRESS_COLORS.low }]} />
              <View style={styles.legendText}>
                <ThemedText type="small" themeColor="textSecondary">Bas</ThemedText>
                <ThemedText style={styles.legendValue}>
                  {formatDuration(stress.lowDurationSeconds)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: STRESS_COLORS.medium }]} />
              <View style={styles.legendText}>
                <ThemedText type="small" themeColor="textSecondary">Moyen</ThemedText>
                <ThemedText style={styles.legendValue}>
                  {formatDuration(stress.mediumDurationSeconds)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: STRESS_COLORS.high }]} />
              <View style={styles.legendText}>
                <ThemedText type="small" themeColor="textSecondary">Élevé</ThemedText>
                <ThemedText style={styles.legendValue}>
                  {formatDuration(stress.highDurationSeconds)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
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
  valueSection: {
    gap: 2,
    overflow: 'visible',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    overflow: 'visible',
  },
  levelValue: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts.mono,
  },
  distribution: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
