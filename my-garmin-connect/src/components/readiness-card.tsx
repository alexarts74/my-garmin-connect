import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getReadinessColor } from '@/lib/training-insights';
import type { TrainingLoadData } from '@/types/training-load';

interface ReadinessCardProps {
  data: TrainingLoadData;
}

export function ReadinessCard({ data }: ReadinessCardProps) {
  const colors = useTheme();
  const router = useRouter();
  const readinessColor = getReadinessColor(data.readinessLevel);

  return (
    <Pressable
      onPress={() => router.push('/(dashboard)/training-load')}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.scoreSection}>
            <View style={[styles.scoreBadge, { backgroundColor: readinessColor + '20' }]}>
              <Text style={[styles.scoreText, { color: readinessColor }]}>
                {data.recoveryScore}
              </Text>
            </View>
            <View style={styles.labelSection}>
              <ThemedText style={styles.readinessLabel}>
                {data.readinessLabel}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Score de récupération
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.arrow, { color: colors.textSecondary }]}>
            ›
          </ThemedText>
        </View>
        {data.insights.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {data.insights[0]}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
  },
  labelSection: {
    gap: 2,
  },
  readinessLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
