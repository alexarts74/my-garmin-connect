import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { DEFAULT_NUTRITION_TARGETS } from '@/constants/nutrition-targets';
import { useTheme } from '@/hooks/use-theme';
import type { DailyNutrition } from '@/types/nutrition';

interface MacroSummaryProps {
  daily: DailyNutrition;
  caloriesBurned?: number;
}

function MacroBar({
  label,
  value,
  color,
  max,
}: {
  label: string;
  value: number;
  color: string;
  max: number;
}) {
  const colors = useTheme();
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <ThemedText style={[styles.macroLabel, { color }]}>{label}</ThemedText>
        <ThemedText style={styles.macroValue}>{value}g</ThemedText>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.backgroundSelected }]}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MacroSummary({ daily, caloriesBurned }: MacroSummaryProps) {
  const colors = useTheme();
  const balance = caloriesBurned != null ? daily.totalCalories - caloriesBurned : null;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.calorieRow}>
        <View style={styles.calorieBlock}>
          <ThemedText style={[styles.calorieValue, { color: colors.accent }]}>
            {daily.totalCalories}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ingérées
          </ThemedText>
        </View>
        {caloriesBurned != null && (
          <>
            <ThemedText style={styles.minus} themeColor="textSecondary">
              −
            </ThemedText>
            <View style={styles.calorieBlock}>
              <ThemedText style={styles.calorieValue}>
                {caloriesBurned}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                brûlées
              </ThemedText>
            </View>
            <ThemedText style={styles.equals} themeColor="textSecondary">
              =
            </ThemedText>
            <View style={styles.calorieBlock}>
              <ThemedText
                style={[
                  styles.calorieValue,
                  { color: balance != null && balance > 0 ? '#F39C12' : '#2ECC71' },
                ]}
              >
                {balance}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                balance
              </ThemedText>
            </View>
          </>
        )}
      </View>

      <View style={styles.macros}>
        <MacroBar label="Protéines" value={daily.totalProtein} color="#3498DB" max={DEFAULT_NUTRITION_TARGETS.protein} />
        <MacroBar label="Glucides" value={daily.totalCarbs} color="#F39C12" max={DEFAULT_NUTRITION_TARGETS.carbs} />
        <MacroBar label="Lipides" value={daily.totalFat} color="#E74C3C" max={DEFAULT_NUTRITION_TARGETS.fat} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  calorieBlock: {
    alignItems: 'center',
    gap: 2,
  },
  calorieValue: {
    fontSize: 24,
    fontFamily: Fonts.mono,
  },
  minus: {
    fontSize: 20,
    fontFamily: Fonts.regular,
  },
  equals: {
    fontSize: 20,
    fontFamily: Fonts.regular,
  },
  macros: {
    gap: Spacing.three,
  },
  macroItem: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  macroValue: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
