import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HealthCard } from '@/components/health-card';
import { LastRunCard } from '@/components/last-run-card';
import { ReadinessCard } from '@/components/readiness-card';
import { WeeklySummary } from '@/components/weekly-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useAuth } from '@/hooks/use-auth';
import { useHealthToday, useVitals, useWeeklyStats } from '@/hooks/use-health';
import { useTrainingLoad } from '@/hooks/use-training-load';
import { useHRV, useHRRecovery } from '@/hooks/use-healthkit';
import { useTheme } from '@/hooks/use-theme';
import { formatSleepDuration } from '@/lib/format';

export default function DashboardScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealthToday();
  const { data: vitals, isLoading: vitalsLoading, refetch: refetchVitals } = useVitals();
  const { data: weeklyStats, isLoading: weeklyLoading, refetch: refetchWeekly } = useWeeklyStats();
  const { data: trainingLoad } = useTrainingLoad();
  const { hrv } = useHRV();
  const { recovery: hrRecovery } = useHRRecovery();

  const colors = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchActivities(), refetchHealth(), refetchVitals(), refetchWeekly()]);
    setRefreshing(false);
  }, [refetchActivities, refetchHealth, refetchVitals, refetchWeekly]);

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

  const isLoading = activitiesLoading && healthLoading && vitalsLoading && weeklyLoading;
  const lastRun = activities?.[0];

  if (isLoading) {
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <ThemedText type="subtitle" style={styles.greeting}>
              Dashboard
            </ThemedText>

            {trainingLoad && <ReadinessCard data={trainingLoad} />}

            {lastRun && <LastRunCard activity={lastRun} />}

            {weeklyStats && <WeeklySummary stats={weeklyStats} />}

            {health && (
              <View style={styles.healthSection}>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                  {"Aujourd'hui"}
                </ThemedText>
                <View style={styles.healthRow}>
                  <HealthCard
                    symbolName={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                    value={vitals?.latestHeartRate ? `${vitals.latestHeartRate}` : health.restingHeartRate > 0 ? `${health.restingHeartRate}` : '--'}
                    unit="bpm"
                    label={vitals?.latestHeartRate ? 'Dernier BPM' : 'FC repos'}
                  />
                  <HealthCard
                    symbolName={{ ios: 'lungs.fill', android: 'air', web: 'air' }}
                    value={vitals?.vo2Max ? `${vitals.vo2Max}` : '--'}
                    label="VO2 max"
                  />
                  <HealthCard
                    symbolName={{ ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' }}
                    value={health.steps.toLocaleString('fr-FR')}
                    label="Pas"
                  />
                </View>
                <View style={styles.healthRow}>
                  <HealthCard
                    symbolName={{ ios: 'moon.fill', android: 'bedtime', web: 'bedtime' }}
                    value={formatSleepDuration(health.sleepDurationSeconds)}
                    label="Sommeil"
                    onPress={() => router.push('/(dashboard)/sleep')}
                  />
                  <HealthCard
                    symbolName={{ ios: 'heart.circle', android: 'monitor_heart', web: 'monitor_heart' }}
                    value={vitals?.restingHeartRate ? `${vitals.restingHeartRate}` : '--'}
                    unit="bpm"
                    label="FC repos"
                  />
                  <HealthCard
                    symbolName={{ ios: 'heart.text.square', android: 'ecg_heart', web: 'ecg_heart' }}
                    value={vitals?.lastSevenDaysAvgRestingHeartRate ? `${vitals.lastSevenDaysAvgRestingHeartRate}` : '--'}
                    unit="bpm"
                    label="FC moy. 7j"
                  />
                </View>
                {(hrv.latestSDNN != null || hrRecovery.bpm != null) && (
                  <View style={styles.healthRow}>
                    <HealthCard
                      symbolName={{ ios: 'waveform.path.ecg', android: 'show_chart', web: 'show_chart' }}
                      value={hrv.latestSDNN != null ? `${hrv.latestSDNN}` : '--'}
                      unit="ms"
                      label="HRV (SDNN)"
                    />
                    <HealthCard
                      symbolName={{ ios: 'arrow.down.heart.fill', android: 'trending_down', web: 'trending_down' }}
                      value={hrRecovery.bpm != null ? `${hrRecovery.bpm}` : '--'}
                      unit="bpm"
                      label="Recup. FC 1min"
                    />
                    <View style={{ flex: 1 }} />
                  </View>
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
  greeting: {
    marginBottom: Spacing.one,
    fontSize: 24,
    fontWeight: '700',
  },
  healthSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
  },
});
