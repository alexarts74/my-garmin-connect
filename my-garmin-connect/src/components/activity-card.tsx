import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { formatDate, formatDistance, formatDuration, formatPace } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { GarminActivity } from '@/types/garmin';

interface ActivityCardProps {
  activity: GarminActivity;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActivityCard({ activity }: ActivityCardProps) {
  const router = useRouter();
  const colors = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={() => router.push(`/(activities)/${activity.activityId}` as any)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(activity.startTimeLocal)}
        </ThemedText>
        <ThemedText style={styles.name} numberOfLines={1}>
          {activity.activityName}
        </ThemedText>
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
          <View style={styles.stat}>
            <ThemedText style={styles.statValue}>
              {activity.calories > 0 ? `${activity.calories}` : '--'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              kcal
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.one,
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: Spacing.four,
  },
  stat: {
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 14,
    fontFamily: Fonts.mono,
  },
});
