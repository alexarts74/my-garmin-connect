import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SleepStagesBar } from '@/components/sleep-stages-bar';
import { SleepTimeline } from '@/components/sleep-timeline';
import { StatRow } from '@/components/stat-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useSleepDetail } from '@/hooks/use-health';
import { useTheme } from '@/hooks/use-theme';
import { formatSleepDuration, formatTime } from '@/lib/format';

const QUALIFIER_LABELS: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Bon',
  FAIR: 'Correct',
  POOR: 'Mauvais',
};

function qualifierLabel(key: string | undefined): string {
  if (!key) return '';
  return QUALIFIER_LABELS[key.toUpperCase()] ?? key;
}

function qualifierColor(key: string | undefined, accent: string): string {
  switch (key?.toUpperCase()) {
    case 'EXCELLENT': return '#10B981';
    case 'GOOD': return accent;
    case 'FAIR': return '#F59E0B';
    case 'POOR': return '#F87171';
    default: return accent;
  }
}

export default function SleepDetailScreen() {
  const { data: sleep, isLoading, error } = useSleepDetail();
  const colors = useTheme();

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error || !sleep) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.error}>
          {error instanceof Error ? error.message : 'Aucune donnée de sommeil'}
        </ThemedText>
      </ThemedView>
    );
  }

  const overallQualifier = sleep.sleepScores?.overall?.qualifierKey;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Score */}
        <View style={styles.heroSection}>
          <ThemedText style={styles.heroScore}>
            {sleep.sleepScore > 0 ? sleep.sleepScore : '--'}
          </ThemedText>
          {overallQualifier && (
            <ThemedText
              style={[styles.heroLabel, { color: qualifierColor(overallQualifier, colors.accent) }]}
            >
              {qualifierLabel(overallQualifier)}
            </ThemedText>
          )}
        </View>

        {/* Duration & Times */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Durée
          </ThemedText>
          <View style={styles.durationRow}>
            <View style={styles.durationMain}>
              <ThemedText style={styles.durationValue}>
                {formatSleepDuration(sleep.sleepTimeSeconds)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                de sommeil
              </ThemedText>
            </View>
            <View style={styles.times}>
              <View style={styles.timeItem}>
                <ThemedText type="small" themeColor="textSecondary">Coucher</ThemedText>
                <ThemedText style={styles.timeValue}>
                  {formatTime(sleep.sleepStartTimestampGMT)}
                </ThemedText>
              </View>
              <View style={styles.timeItem}>
                <ThemedText type="small" themeColor="textSecondary">Lever</ThemedText>
                <ThemedText style={styles.timeValue}>
                  {formatTime(sleep.sleepEndTimestampGMT)}
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Sleep Stages */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Phases de sommeil
          </ThemedText>
          <SleepStagesBar
            deep={sleep.deepSleepSeconds}
            light={sleep.lightSleepSeconds}
            rem={sleep.remSleepSeconds}
            awake={sleep.awakeSleepSeconds}
          />
        </ThemedView>

        {/* Timeline */}
        {sleep.sleepLevels.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Timeline
            </ThemedText>
            <SleepTimeline
              sleepLevels={sleep.sleepLevels}
              sleepStartTimestampGMT={sleep.sleepStartTimestampGMT}
              sleepEndTimestampGMT={sleep.sleepEndTimestampGMT}
            />
          </ThemedView>
        )}

        {/* Detailed Scores */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Scores détaillés
          </ThemedText>
          <StatRow
            label="Durée totale"
            value={sleep.sleepScores?.totalDuration?.value != null ? `${sleep.sleepScores.totalDuration.value}` : '--'}
          />
          <StatRow
            label="Sommeil profond"
            value={sleep.sleepScores?.deepPercentage?.value != null ? `${sleep.sleepScores.deepPercentage.value}` : '--'}
          />
          <StatRow
            label="Sommeil léger"
            value={sleep.sleepScores?.lightPercentage?.value != null ? `${sleep.sleepScores.lightPercentage.value}` : '--'}
          />
          <StatRow
            label="Sommeil REM"
            value={sleep.sleepScores?.remPercentage?.value != null ? `${sleep.sleepScores.remPercentage.value}` : '--'}
          />
          <StatRow
            label="Stress"
            value={sleep.sleepScores?.stress?.value != null ? `${sleep.sleepScores.stress.value}` : '--'}
          />
          <StatRow
            label="Agitation"
            value={sleep.sleepScores?.restlessness?.value != null ? `${sleep.sleepScores.restlessness.value}` : '--'}
          />
          <StatRow
            label="Réveils"
            value={sleep.sleepScores?.awakeCount?.value != null ? `${sleep.sleepScores.awakeCount.value}` : '--'}
          />
        </ThemedView>

        {/* Vital Signs */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Signes vitaux
          </ThemedText>
          <StatRow
            label="Respiration moy."
            value={sleep.averageRespirationValue > 0 ? `${sleep.averageRespirationValue} rpm` : '--'}
          />
          <StatRow
            label="Respiration min"
            value={sleep.lowestRespirationValue > 0 ? `${sleep.lowestRespirationValue} rpm` : '--'}
          />
          <StatRow
            label="Respiration max"
            value={sleep.highestRespirationValue > 0 ? `${sleep.highestRespirationValue} rpm` : '--'}
          />
          <StatRow
            label="FC repos"
            value={sleep.restingHeartRate > 0 ? `${sleep.restingHeartRate} bpm` : '--'}
          />
          <StatRow
            label="FC min (nuit)"
            value={sleep.minSleepHR > 0 ? `${sleep.minSleepHR} bpm` : '--'}
          />
          <StatRow
            label="FC moy. (nuit)"
            value={sleep.avgSleepHR > 0 ? `${sleep.avgSleepHR} bpm` : '--'}
          />
          <StatRow
            label="HRV"
            value={sleep.avgOvernightHrv > 0 ? `${sleep.avgOvernightHrv} ms` : '--'}
            accent
          />
          {sleep.hrvStatus ? (
            <StatRow label="Statut HRV" value={sleep.hrvStatus} />
          ) : null}
        </ThemedView>

        {/* Recovery */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Récupération
          </ThemedText>
          <StatRow
            label="Body Battery"
            value={sleep.bodyBatteryChange !== 0 ? `+${sleep.bodyBatteryChange}` : '--'}
            accent
          />
          <StatRow
            label="Stress moyen"
            value={sleep.avgSleepStress > 0 ? `${sleep.avgSleepStress}` : '--'}
          />
          <StatRow
            label="Moments agités"
            value={sleep.restlessMomentsCount > 0 ? `${sleep.restlessMomentsCount}` : '--'}
          />
          <StatRow
            label="Réveils"
            value={sleep.awakeCount > 0 ? `${sleep.awakeCount}` : '--'}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  heroScore: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  heroLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationMain: {
    gap: Spacing.half,
  },
  durationValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  times: {
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  timeItem: {
    alignItems: 'flex-end',
    gap: 1,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.mono,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: Spacing.four,
  },
});
