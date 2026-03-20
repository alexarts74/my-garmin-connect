import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BodyBatteryCardProps {
  bodyBatteryAtWake: number;
  bodyBatteryAtSleep: number;
  bodyBatteryChange: number;
}

function getBatteryColor(value: number): string {
  if (value >= 70) return '#10B981';
  if (value >= 40) return '#F59E0B';
  return '#F87171';
}

export function BodyBatteryCard({ bodyBatteryAtWake, bodyBatteryAtSleep, bodyBatteryChange }: BodyBatteryCardProps) {
  const colors = useTheme();

  const wakeColor = getBatteryColor(bodyBatteryAtWake);
  const deltaSign = bodyBatteryChange > 0 ? '+' : '';
  const deltaColor = bodyBatteryChange > 0 ? '#10B981' : bodyBatteryChange < 0 ? '#F87171' : colors.textSecondary;
  const fillPercent = Math.max(0, Math.min(100, bodyBatteryAtWake));

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="smallBold" style={{ color: colors.accent }}>
          Body Battery
        </ThemedText>
        <ThemedText style={[styles.chevron, { color: colors.textSecondary }]}>
          ›
        </ThemedText>
      </View>

      {/* Main row: badge + value + delta */}
      <View style={styles.mainRow}>
        <View style={[styles.scoreBadge, { backgroundColor: wakeColor + '20' }]}>
          <SymbolView
            name={{ ios: 'battery.100percent.bolt', android: 'battery_charging_full', web: 'battery_charging_full' }}
            size={24}
            tintColor={wakeColor}
          />
        </View>

        <View style={styles.valueSection}>
          <View style={styles.wakeRow}>
            <ThemedText style={[styles.wakeValue, { color: wakeColor }]}>
              {bodyBatteryAtWake}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              au réveil
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.delta, { color: deltaColor }]}>
          {deltaSign}{bodyBatteryChange}
        </ThemedText>
      </View>

      {/* Progress bar */}
      <View style={styles.barRow}>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, {
              width: `${fillPercent}%`,
              backgroundColor: wakeColor,
            }]}
          />
        </View>
        <ThemedText style={styles.barLabel} themeColor="textSecondary">
          {bodyBatteryAtWake}/100
        </ThemedText>
      </View>

      {/* Secondary: sleep value */}
      <ThemedText type="small" themeColor="textSecondary">
        Coucher {bodyBatteryAtSleep}
      </ThemedText>
    </ThemedView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: {
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
  valueSection: {
    flex: 1,
    gap: 2,
    overflow: 'visible',
  },
  wakeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    overflow: 'visible',
  },
  wakeValue: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts.mono,
  },
  delta: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
});
