import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MetricEvolutionChart } from '@/components/charts/metric-evolution-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useHealthHistory, useVitals } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';

export default function HeartRateScreen() {
  const { data: vitals, isLoading: vitalsLoading } = useVitals();
  const { data: history, isLoading: historyLoading } = useHealthHistory(30);
  const colors = useTheme();

  if ((vitalsLoading || historyLoading) && !history) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const hrData = history?.restingHR ?? [];
  const values = hrData.map((d) => d.value);
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.inner}>
          {/* Hero */}
          <View style={styles.hero}>
            <ThemedText style={[styles.heroValue, { color: '#E74C3C' }]}>
              {vitals?.restingHeartRate ? `${vitals.restingHeartRate}` : '--'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              bpm au repos aujourd'hui
            </ThemedText>
          </View>

          {/* Chart */}
          {hrData.length >= 2 && (
            <MetricEvolutionChart
              data={hrData}
              title="FC repos (30 jours)"
              unit="bpm"
              description="Fréquence cardiaque au repos"
              color="#E74C3C"
            />
          )}

          {/* Stats */}
          <ThemedView type="backgroundElement" style={styles.statsCard}>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Moyenne</ThemedText>
              <ThemedText style={styles.statValue}>{avg > 0 ? `${avg} bpm` : '--'}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Minimum</ThemedText>
              <ThemedText style={styles.statValue}>{min > 0 ? `${min} bpm` : '--'}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Maximum</ThemedText>
              <ThemedText style={styles.statValue}>{max > 0 ? `${max} bpm` : '--'}</ThemedText>
            </View>
            {vitals?.lastSevenDaysAvgRestingHeartRate ? (
              <View style={styles.statRow}>
                <ThemedText type="small" themeColor="textSecondary">Moyenne 7j</ThemedText>
                <ThemedText style={styles.statValue}>{vitals.lastSevenDaysAvgRestingHeartRate} bpm</ThemedText>
              </View>
            ) : null}
            <View style={styles.statRow}>
              <ThemedText type="small" themeColor="textSecondary">Jours enregistrés</ThemedText>
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
