import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MetricEvolutionChart } from '@/components/charts/metric-evolution-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useHealthHistory, useHealthToday } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

export default function CaloriesScreen() {
  const { data: history, isLoading: historyLoading } = useHealthHistory(30);
  const { data: health } = useHealthToday();
  const colors = useTheme();

  if (historyLoading && !history) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const todayCalories = health?.totalCalories ?? 0;

  const caloriesData = history?.calories ?? [];
  const values = caloriesData.map((d) => d.value);
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.inner}>
          {/* Hero */}
          <View style={styles.hero}>
            <ThemedText style={[styles.heroValue, { color: '#F59E0B' }]}>
              {todayCalories > 0 ? todayCalories.toLocaleString('fr-FR') : '--'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              kcal aujourd'hui
            </ThemedText>
          </View>

          {/* Chart */}
          {caloriesData.length >= 2 && (
            <MetricEvolutionChart
              data={caloriesData}
              title="Calories (30 jours)"
              unit="kcal"
              description="Calories actives brûlées par jour"
              color="#F59E0B"
              formatValue={(v) => v.toLocaleString('fr-FR')}
            />
          )}

          {/* Stats */}
          <ThemedView type="backgroundElement" style={styles.statsCard}>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Moyenne / jour</ThemedText>
              <ThemedText style={styles.statValue}>{avg.toLocaleString('fr-FR')} kcal</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Maximum</ThemedText>
              <ThemedText style={styles.statValue}>{max.toLocaleString('fr-FR')} kcal</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Total 30j</ThemedText>
              <ThemedText style={styles.statValue}>{total.toLocaleString('fr-FR')} kcal</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Jours actifs</ThemedText>
              <ThemedText style={styles.statValue}>{values.length}</ThemedText>
            </View>
          </ThemedView>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
  },
  inner: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  heroValue: {
    fontSize: 40,
    fontFamily: Fonts.mono,
    lineHeight: 48,
  },
  statsCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
});
