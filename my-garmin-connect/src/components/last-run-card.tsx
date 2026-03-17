import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { formatDate, formatDistance, formatDuration, formatPace } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { GarminActivity } from '@/types/garmin';

interface LastRunCardProps {
  activity: GarminActivity;
}

export function LastRunCard({ activity }: LastRunCardProps) {
  const router = useRouter();
  const colors = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
        Derniere course
      </ThemedText>
      <Pressable
        onPress={() => router.push(`/(activities)/${activity.activityId}` as any)}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
          <View style={styles.header}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {activity.activityName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(activity.startTimeLocal)}
            </ThemedText>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText style={[styles.statValue, { color: colors.accent }]}>
                {formatDistance(activity.distance)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Distance
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statValue}>
                {formatDuration(activity.duration)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Duree
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statValue}>
                {formatPace(activity.averageSpeed)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Allure
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    paddingLeft: Spacing.four + 6,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 1.5,
  },
  header: {
    gap: Spacing.half,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.mono,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
