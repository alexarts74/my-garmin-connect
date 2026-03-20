import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SplitsTable } from '@/components/splits-table';
import { ShoePicker } from '@/components/shoe-picker';
import { StatRow } from '@/components/stat-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useActivity } from '@/hooks/use-activities';
import { useShoeForActivity, useShoeActions } from '@/hooks/use-shoes';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDistance, formatDuration, formatPace } from '@/lib/format';
import { useHealthKitWorkout, useHRZones } from '@/hooks/use-healthkit';
import { HRZonesChart } from '@/components/hr-zones-chart';

// Lazy import to avoid loading native maps on web
const RunMap = Platform.OS !== 'web'
  ? React.lazy(() => import('@/components/run-map').then((m) => ({ default: m.RunMap })))
  : null;

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: activity, isLoading, error } = useActivity(id);
  const colors = useTheme();
  const [shoePickerVisible, setShoePickerVisible] = useState(false);

  const activityId = activity?.activityId;
  const { data: linkedShoe } = useShoeForActivity(activityId);
  const { linkShoe, unlinkShoe } = useShoeActions();

  const { workout: hkWorkout, loading: hkLoading } = useHealthKitWorkout(
    activity?.startTimeLocal,
    activity?.distance,
  );

  const { zones: hrZones } = useHRZones(hkWorkout, activity?.maxHR);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error || !activity) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.error}>
          {error instanceof Error ? error.message : 'Failed to load activity'}
        </ThemedText>
      </ThemedView>
    );
  }

  const hasLaps = activity.lapDTOs && activity.lapDTOs.length > 0;
  const hasVO2Max = 'vO2MaxValue' in activity && activity.vO2MaxValue > 0;
  const hasRoute = hkWorkout?.route && hkWorkout.route.length >= 2;
  const hasHRZones = hrZones.length > 0;
  const form = hkWorkout?.runningForm;
  const hasRunningForm = form && (
    form.strideLength || form.groundContactTime || form.verticalOscillation || form.runningPower
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: activity.activityName,
          headerRight: () => (
            <Pressable
              onPress={() => setShoePickerVisible(true)}
              style={({ pressed }) => [styles.headerShoeButton, pressed && { opacity: 0.6 }]}
              hitSlop={8}>
              {linkedShoe ? (
                <ThemedText style={[styles.headerShoeName, { color: colors.accent }]} numberOfLines={1}>
                  {linkedShoe.name}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.headerShoeAdd, { color: colors.textSecondary }]}>
                  + Chaussure
                </ThemedText>
              )}
            </Pressable>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{activity.activityName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(activity.startTimeLocal)}
          </ThemedText>

          {/* GPS Route Map */}
          {hasRoute && RunMap && (
            <React.Suspense fallback={<ThemedView style={styles.mapPlaceholder} type="backgroundElement" />}>
              <RunMap route={hkWorkout.route!} />
            </React.Suspense>
          )}
          {hkLoading && Platform.OS === 'ios' && (
            <ThemedView style={[styles.mapPlaceholder, styles.mapLoading]} type="backgroundElement">
              <ActivityIndicator size="small" />
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Performance
            </ThemedText>
            <StatRow label="Distance" value={formatDistance(activity.distance)} accent />
            <StatRow label="Duree" value={formatDuration(activity.duration)} />
            <StatRow label="Allure moy." value={formatPace(activity.averageSpeed)} accent />
            <StatRow label="Allure max." value={formatPace(activity.maxSpeed)} />
            {hasVO2Max && (
              <StatRow label="VO2 Max" value={`${activity.vO2MaxValue}`} />
            )}
          </ThemedView>

          <ShoePicker
            visible={shoePickerVisible}
            selectedShoeId={linkedShoe?.id}
            onSelect={(shoe) => {
              setShoePickerVisible(false);
              if (!activityId) return;
              if (shoe) {
                linkShoe.mutate({
                  activityId,
                  shoeId: shoe.id,
                  distanceMeters: activity.distance,
                });
              } else {
                unlinkShoe.mutate(activityId);
              }
            }}
            onClose={() => setShoePickerVisible(false)}
          />

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Cardio
            </ThemedText>
            <StatRow label="FC moyenne" value={activity.averageHR ? `${activity.averageHR} bpm` : '--'} />
            <StatRow label="FC max" value={activity.maxHR ? `${activity.maxHR} bpm` : '--'} />
          </ThemedView>

          {hasHRZones && (
            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                Zones FC
              </ThemedText>
              <HRZonesChart zones={hrZones} />
            </ThemedView>
          )}

          {/* Running Form (from HealthKit) */}
          {hasRunningForm && (
            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                Running Form
              </ThemedText>
              {form.strideLength != null && (
                <StatRow label="Foulée" value={`${form.strideLength} m`} />
              )}
              {form.groundContactTime != null && (
                <StatRow label="Contact au sol" value={`${form.groundContactTime} ms`} />
              )}
              {form.verticalOscillation != null && (
                <StatRow label="Oscillation verticale" value={`${form.verticalOscillation} cm`} />
              )}
              {form.runningPower != null && (
                <StatRow label="Puissance" value={`${form.runningPower} W`} accent />
              )}
            </ThemedView>
          )}

          {hasLaps && (
            <ThemedView style={styles.splitsSection}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                Splits
              </ThemedText>
              <SplitsTable laps={activity.lapDTOs} />
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Autres
            </ThemedText>
            <StatRow label="Calories" value={activity.calories ? `${activity.calories} kcal` : '--'} />
            <StatRow label="Denivele +" value={activity.elevationGain ? `${Math.round(activity.elevationGain)} m` : '--'} />
            <StatRow label="Denivele -" value={activity.elevationLoss ? `${Math.round(activity.elevationLoss)} m` : '--'} />
            {'steps' in activity && (
              <StatRow label="Pas" value={`${activity.steps}`} />
            )}
            {'averageRunningCadenceInStepsPerMinute' in activity && (
              <StatRow
                label="Cadence moy."
                value={`${activity.averageRunningCadenceInStepsPerMinute} spm`}
              />
            )}
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </>
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
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  section: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  splitsSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  mapPlaceholder: {
    height: 220,
    borderRadius: 14,
  },
  mapLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: Spacing.four,
  },
  headerShoeButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  headerShoeName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    maxWidth: 140,
  },
  headerShoeAdd: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
