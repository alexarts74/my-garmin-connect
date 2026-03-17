import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityCard } from '@/components/activity-card';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useActivities } from '@/hooks/use-activities';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance } from '@/lib/format';
import type { GarminActivity } from '@/types/garmin';

function MonthlyHeader({ activities }: { activities: GarminActivity[] }) {
  const colors = useTheme();
  const now = new Date();
  const monthRuns = activities.filter((a) => {
    const d = new Date(a.startTimeLocal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalDistance = monthRuns.reduce((sum, a) => sum + a.distance, 0);

  return (
    <View style={styles.monthHeader}>
      <ScreenHeader title="Activités" titleStyle={styles.title} />
      <View style={styles.monthStats}>
        <ThemedText style={[styles.monthStat, { color: colors.accent }]}>
          {formatDistance(totalDistance)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {monthRuns.length} course{monthRuns.length !== 1 ? 's' : ''} ce mois
        </ThemedText>
      </View>
    </View>
  );
}

export default function ActivitiesScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: activities, isLoading, error, refetch, isRefetching } = useActivities();

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

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.error}>
          {error instanceof Error ? error.message : 'Failed to load activities'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={activities}
          keyExtractor={(item) => item.activityId.toString()}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListHeaderComponent={
            activities && activities.length > 0 ? (
              <MonthlyHeader activities={activities} />
            ) : null
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Aucune course trouvee
            </ThemedText>
          }
        />
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
  list: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  monthHeader: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  monthStat: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: Spacing.four,
  },
});
