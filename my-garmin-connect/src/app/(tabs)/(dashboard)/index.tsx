import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyBatteryCard } from '@/components/body-battery-card';
import { HealthCard } from '@/components/health-card';
import { LastRunCard } from '@/components/last-run-card';
import { ReadinessCard } from '@/components/readiness-card';
import { SleepSummaryCard } from '@/components/sleep-summary-card';
import { StressCard } from '@/components/stress-card';
import { WeeklySummary } from '@/components/weekly-summary';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useActivities } from '@/hooks/use-activities';
import { useAuth } from '@/hooks/use-auth';
import { useHealthToday, useSleepDetail, useStress, useVitals, useWeeklyStats } from '@/hooks/use-health';
import { useTrainingLoad } from '@/hooks/use-training-load';
import { useHRV, useHRRecovery } from '@/hooks/use-healthkit';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealthToday();
  const { data: vitals, isLoading: vitalsLoading, refetch: refetchVitals } = useVitals();
  const { data: weeklyStats, isLoading: weeklyLoading, refetch: refetchWeekly } = useWeeklyStats();
  const { data: sleepDetail, refetch: refetchSleep } = useSleepDetail();
  const { data: stressData, refetch: refetchStress } = useStress();
  const { data: trainingLoad } = useTrainingLoad();
  const { hrv } = useHRV();
  const { recovery: hrRecovery } = useHRRecovery();

  const colors = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchActivities(), refetchHealth(), refetchVitals(), refetchWeekly(), refetchSleep(), refetchStress()]);
    setRefreshing(false);
  }, [refetchActivities, refetchHealth, refetchVitals, refetchWeekly, refetchSleep, refetchStress]);

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

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayActivities = React.useMemo(
    () => activities?.filter(a => a.startTimeLocal?.slice(0, 10) === today) ?? [],
    [activities, today]
  );
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
            <ScreenHeader title="Dashboard" titleStyle={styles.greeting} />

            {todayActivities.length > 0 && (
              <View style={styles.todaySection}>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                  {todayActivities.length === 1 ? 'Activité du jour' : 'Activités du jour'}
                </ThemedText>
                {todayActivities.map(activity => (
                  <LastRunCard key={activity.activityId} activity={activity} />
                ))}
              </View>
            )}

            {trainingLoad && <ReadinessCard data={trainingLoad} />}

            {sleepDetail && <SleepSummaryCard sleep={sleepDetail} />}

            {health && (health.bodyBatteryAtWake > 0 || health.bodyBatteryChange !== 0) && (
              <Pressable onPress={() => router.push('/sleep')} style={({ pressed }) => pressed && styles.pressed}>
                <BodyBatteryCard
                  bodyBatteryAtWake={health.bodyBatteryAtWake}
                  bodyBatteryAtSleep={health.bodyBatteryAtSleep}
                  bodyBatteryChange={health.bodyBatteryChange}
                />
              </Pressable>
            )}

            {stressData && stressData.overallLevel > 0 && (
              <StressCard stress={stressData} />
            )}

            {lastRun && !todayActivities.some(a => a.activityId === lastRun.activityId) && (
              <LastRunCard activity={lastRun} />
            )}

            {weeklyStats && (
              <Pressable onPress={() => router.push('/trends')} style={({ pressed }) => pressed && styles.pressed}>
                <WeeklySummary stats={weeklyStats} />
              </Pressable>
            )}

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
                    onPress={() => router.push('/heart-rate')}
                  />
                  <HealthCard
                    symbolName={{ ios: 'lungs.fill', android: 'air', web: 'air' }}
                    value={vitals?.vo2Max ? `${vitals.vo2Max}` : '--'}
                    label="VO2 max"
                    onPress={() => router.push('/trends')}
                  />
                  <HealthCard
                    symbolName={{ ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' }}
                    value={health.steps.toLocaleString('fr-FR')}
                    label="Pas"
                    onPress={() => router.push('/steps')}
                  />
                </View>
                <View style={styles.healthRow}>
                  <HealthCard
                    symbolName={{ ios: 'heart.circle', android: 'monitor_heart', web: 'monitor_heart' }}
                    value={vitals?.restingHeartRate ? `${vitals.restingHeartRate}` : '--'}
                    unit="bpm"
                    label="FC repos"
                    onPress={() => router.push('/heart-rate')}
                  />
                  <HealthCard
                    symbolName={{ ios: 'heart.text.square', android: 'ecg_heart', web: 'ecg_heart' }}
                    value={vitals?.lastSevenDaysAvgRestingHeartRate ? `${vitals.lastSevenDaysAvgRestingHeartRate}` : '--'}
                    unit="bpm"
                    label="FC moy. 7j"
                    onPress={() => router.push('/trends')}
                  />
                  <HealthCard
                    symbolName={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }}
                    value={health.totalCalories > 0 ? health.totalCalories.toLocaleString('fr-FR') : '--'}
                    unit="kcal"
                    label="Calories"
                    onPress={() => router.push('/calories')}
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
    fontFamily: Fonts.bold,
  },
  todaySection: {
    gap: Spacing.two,
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
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
