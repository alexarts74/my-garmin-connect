import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TrainingPrediction } from '@/types/health';

interface TrainingPredictionCardProps {
  prediction: TrainingPrediction;
}

const INTENSITY_COLORS: Record<string, string> = {
  high: '#10B981',
  moderate: '#3B82F6',
  easy: '#F59E0B',
  rest: '#F87171',
};

const RECOVERY_COLORS: Record<string, string> = {
  excellent: '#10B981',
  good: '#34D399',
  fair: '#F59E0B',
  poor: '#F87171',
};

export function TrainingPredictionCard({ prediction }: TrainingPredictionCardProps) {
  const colors = useTheme();
  const intensityColor = INTENSITY_COLORS[prediction.recommendedIntensity] ?? colors.accent;
  const recoveryColor = RECOVERY_COLORS[prediction.recoveryQuality] ?? colors.accent;

  return (
    <View style={styles.container}>
      {/* Intensity badge */}
      <View style={[styles.intensityBadge, { backgroundColor: intensityColor + '18' }]}>
        <ThemedText style={[styles.intensityText, { color: intensityColor }]}>
          {prediction.intensityLabel}
        </ThemedText>
        {prediction.maxRecommendedDuration > 0 && (
          <ThemedText style={[styles.durationText, { color: intensityColor }]}>
            jusqu'à {prediction.maxRecommendedDuration} min
          </ThemedText>
        )}
      </View>

      {/* Recovery summary */}
      <View style={styles.recoveryRow}>
        <View style={[styles.recoveryDot, { backgroundColor: recoveryColor }]} />
        <ThemedText type="small" style={{ color: recoveryColor, flex: 1 }}>
          {prediction.recoveryDetail}
        </ThemedText>
      </View>

      {/* Positives */}
      {prediction.positives.length > 0 && (
        <View style={styles.bulletList}>
          {prediction.positives.map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <ThemedText style={styles.bulletPositive}>+</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
                {text}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Warnings */}
      {prediction.warnings.length > 0 && (
        <View style={styles.bulletList}>
          {prediction.warnings.map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <ThemedText style={styles.bulletWarning}>!</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
                {text}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    overflow: 'visible',
  },
  intensityText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  durationText: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  recoveryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  bulletList: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletPositive: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: Fonts.bold,
    width: 14,
    textAlign: 'center',
  },
  bulletWarning: {
    color: '#F59E0B',
    fontSize: 14,
    fontFamily: Fonts.bold,
    width: 14,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
