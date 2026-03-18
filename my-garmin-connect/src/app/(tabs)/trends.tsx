import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VolumeChart } from '@/components/charts/volume-chart';
import { PaceChart } from '@/components/charts/pace-chart';
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap';
import { MetricEvolutionChart } from '@/components/charts/metric-evolution-chart';
import { WeekComparison } from '@/components/charts/week-comparison';
import { RacePredictions } from '@/components/race-predictions';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useHealthHistory } from '@/hooks/use-health';
import { useTrends } from '@/hooks/use-trends';
import { useTheme } from '@/hooks/use-theme';

const PERIOD_OPTIONS = [4, 8, 12] as const;

export default function TrendsScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [weeks, setWeeks] = useState<number>(8);
  const { data, isLoading, refetch, isRefetching } = useTrends(weeks);
  const { data: healthHistory, refetch: refetchHistory } = useHealthHistory(weeks * 7);
  const colors = useTheme();

  if (authLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); refetchHistory(); }} />
          }
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <ScreenHeader title="Tendances" titleStyle={styles.title} />

            {/* Period selector */}
            <View style={styles.periodRow}>
              {PERIOD_OPTIONS.map((w) => (
                <Pressable
                  key={w}
                  onPress={() => setWeeks(w)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <ThemedView
                    type={weeks === w ? undefined : 'backgroundElement'}
                    style={[
                      styles.periodPill,
                      weeks === w && { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={weeks === w ? { color: colors.accent, fontFamily: Fonts.bold } : undefined}
                      themeColor={weeks === w ? undefined : 'textSecondary'}
                    >
                      {w} sem.
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            {data && (
              <>
                <WeekComparison data={data.weeklyData} />
                <VolumeChart data={data.weeklyData} mode="distance" />
                <PaceChart data={data.weeklyData} />
                <CalendarHeatmap data={data.dailyActivity} weeks={weeks} />

                {/* Race Predictions */}
                <View style={styles.section}>
                  <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                    Prédictions de course
                  </ThemedText>
                  <RacePredictions
                    bestEfforts={data.bestEfforts}
                    vo2Max={data.latestVitals.vo2Max}
                  />
                </View>
              </>
            )}

            {healthHistory && (
              <View style={styles.section}>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                  Évolution santé
                </ThemedText>
                {healthHistory.vo2Max.length >= 2 && (
                  <MetricEvolutionChart
                    data={healthHistory.vo2Max}
                    title="VO2 Max"
                    unit="ml/kg/min"
                    description="Capacité aérobie maximale"
                    color={colors.accent}
                  />
                )}
                {healthHistory.restingHR.length >= 2 && (
                  <MetricEvolutionChart
                    data={healthHistory.restingHR}
                    title="FC repos"
                    unit="bpm"
                    description="Fréquence cardiaque au repos"
                    color="#E74C3C"
                  />
                )}
                {healthHistory.steps.length >= 2 && (
                  <MetricEvolutionChart
                    data={healthHistory.steps}
                    title="Pas"
                    description="Nombre de pas quotidien"
                    color="#3498DB"
                    formatValue={(v) => v.toLocaleString('fr-FR')}
                  />
                )}
                {healthHistory.sleepScore.length >= 2 && (
                  <MetricEvolutionChart
                    data={healthHistory.sleepScore}
                    title="Score de sommeil"
                    description="Qualité du sommeil (0-100)"
                    color="#8B5CF6"
                  />
                )}
                {healthHistory.calories && healthHistory.calories.length >= 2 && (
                  <MetricEvolutionChart
                    data={healthHistory.calories}
                    title="Calories"
                    unit="kcal"
                    description="Calories actives brûlées"
                    color="#F59E0B"
                    formatValue={(v) => v.toLocaleString('fr-FR')}
                  />
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  periodPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
});
