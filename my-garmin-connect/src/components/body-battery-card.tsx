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

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" style={{ color: colors.accent }}>
        Body Battery
      </ThemedText>

      <View style={styles.mainRow}>
        {/* Battery icon + wake value */}
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

          {/* Delta */}
          <ThemedText style={[styles.delta, { color: deltaColor }]}>
            {deltaSign}{bodyBatteryChange}
          </ThemedText>
        </View>
      </View>

      {/* Sleep → Wake line */}
      <View style={styles.flowRow}>
        <View style={styles.flowItem}>
          <ThemedText type="small" themeColor="textSecondary">
            Coucher
          </ThemedText>
          <ThemedText style={styles.flowValue}>
            {bodyBatteryAtSleep}
          </ThemedText>
        </View>
        <ThemedText style={[styles.flowArrow, { color: colors.textSecondary }]}>
          →
        </ThemedText>
        <View style={styles.flowItem}>
          <ThemedText type="small" themeColor="textSecondary">
            Réveil
          </ThemedText>
          <ThemedText style={[styles.flowValue, { color: wakeColor }]}>
            {bodyBatteryAtWake}
          </ThemedText>
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
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  flowItem: {
    alignItems: 'center',
    gap: 2,
  },
  flowValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  flowArrow: {
    fontSize: 18,
  },
});
