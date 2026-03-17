import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VolumeChart } from '@/components/charts/volume-chart';
import { PaceChart } from '@/components/charts/pace-chart';
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap';
import { WeekComparison } from '@/components/charts/week-comparison';
import { RacePredictions } from '@/components/race-predictions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTrends } from '@/hooks/use-trends';
import { useTheme } from '@/hooks/use-theme';

const PERIOD_OPTIONS = [4, 8, 12] as const;

export default function TrendsScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [weeks, setWeeks] = useState<number>(8);
  const { data, isLoading, refetch, isRefetching } = useTrends(weeks);
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
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <ThemedText type="subtitle" style={styles.title}>
              Tendances
            </ThemedText>

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
                      style={weeks === w ? { color: colors.accent, fontWeight: '700' } : undefined}
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
    fontWeight: '700',
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
