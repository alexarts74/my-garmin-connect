import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SleepScoreCard } from '@/components/sleep-score-card';
import { SleepStagesBar } from '@/components/sleep-stages-bar';
import { SleepTimeline } from '@/components/sleep-timeline';
import { StatRow } from '@/components/stat-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrainingPredictionCard } from '@/components/training-prediction-card';
import { StressCard } from '@/components/stress-card';
import { Fonts, Spacing } from '@/constants/theme';
import { useHealthHistory, useSleepDetail, useStress } from '@/hooks/use-health';
import { MetricEvolutionChart } from '@/components/charts/metric-evolution-chart';
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
  const { data: stressData } = useStress();
  const { data: healthHistory } = useHealthHistory(30);
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
  const computed = sleep.computedScores;
  const prediction = sleep.trainingPrediction;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Duration Hero + Score */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.durationHero}>
            <ThemedText style={styles.durationValue}>
              {formatSleepDuration(sleep.sleepTimeSeconds)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              de sommeil
            </ThemedText>
          </View>
          {sleep.sleepScore > 0 && (
            <View style={styles.scoreRow}>
              <ThemedText style={[styles.scoreBadge, { color: qualifierColor(overallQualifier, colors.accent) }]}>
                {sleep.sleepScore}
              </ThemedText>
              {overallQualifier && (
                <ThemedText style={[styles.scoreLabel, { color: qualifierColor(overallQualifier, colors.accent) }]}>
                  {qualifierLabel(overallQualifier)}
                </ThemedText>
              )}
            </View>
          )}
          <View style={styles.timesRow}>
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

        {/* Computed Sleep Scores */}
        {computed && (
          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Scores détaillés
            </ThemedText>
            {/* Overall score hero */}
            <View style={styles.overallScoreHero}>
              <SleepScoreCard label="Score global" score={computed.overall} />
            </View>
            {/* Score grid */}
            <View style={styles.scoreGrid}>
              <SleepScoreCard label="Durée" score={computed.duration} />
              <SleepScoreCard label="Profond" score={computed.deep} />
              <SleepScoreCard label="REM" score={computed.rem} />
              <SleepScoreCard label="Léger" score={computed.light} />
              <SleepScoreCard label="Éveillé" score={computed.awake} />
              <SleepScoreCard label="Stress" score={computed.stress} />
              {computed.hrv.score > 0 && (
                <SleepScoreCard label="HRV" score={computed.hrv} />
              )}
            </View>
          </ThemedView>
        )}

        {/* Training Prediction */}
        {prediction && (
          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
              Recommandation entraînement
            </ThemedText>
            <TrainingPredictionCard prediction={prediction} />
          </ThemedView>
        )}

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
          {sleep.avgOvernightHrv > 0 && (
            <StatRow label="HRV" value={`${sleep.avgOvernightHrv} ms`} accent />
          )}
          {sleep.hrvStatus ? (
            <StatRow label="Statut HRV" value={sleep.hrvStatus} />
          ) : null}
        </ThemedView>

        {/* Recovery */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
            Récupération
          </ThemedText>
          {(sleep.bodyBatteryAtSleep > 0 || sleep.bodyBatteryAtWake > 0) ? (
            <View style={styles.bodyBatteryRow}>
              <View style={styles.bodyBatteryItem}>
                <ThemedText type="small" themeColor="textSecondary">Coucher</ThemedText>
                <ThemedText style={styles.bodyBatteryValue}>{sleep.bodyBatteryAtSleep}</ThemedText>
              </View>
              <ThemedText style={[styles.bodyBatteryArrow, { color: colors.textSecondary }]}>→</ThemedText>
              <View style={styles.bodyBatteryItem}>
                <ThemedText type="small" themeColor="textSecondary">Réveil</ThemedText>
                <ThemedText style={[styles.bodyBatteryValue, { color: sleep.bodyBatteryAtWake >= 70 ? '#10B981' : sleep.bodyBatteryAtWake >= 40 ? '#F59E0B' : '#F87171' }]}>
                  {sleep.bodyBatteryAtWake}
                </ThemedText>
              </View>
              <View style={styles.bodyBatteryItem}>
                <ThemedText type="small" themeColor="textSecondary">Delta</ThemedText>
                <ThemedText style={[styles.bodyBatteryValue, { color: sleep.bodyBatteryChange > 0 ? '#10B981' : sleep.bodyBatteryChange < 0 ? '#F87171' : colors.textSecondary }]}>
                  {sleep.bodyBatteryChange > 0 ? '+' : ''}{sleep.bodyBatteryChange}
                </ThemedText>
              </View>
            </View>
          ) : (
            <StatRow
              label="Body Battery"
              value={sleep.bodyBatteryChange !== 0 ? `${sleep.bodyBatteryChange > 0 ? '+' : ''}${sleep.bodyBatteryChange}` : '--'}
              accent
            />
          )}
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
        {/* Sleep Score Evolution */}
        {healthHistory && healthHistory.sleepScore.length >= 2 && (
          <MetricEvolutionChart
            data={healthHistory.sleepScore}
            title="Score de sommeil (30j)"
            color={colors.accent}
          />
        )}

        {/* Daily Stress */}
        {stressData && stressData.overallLevel > 0 && (
          <StressCard stress={stressData} />
        )}
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
  section: {
    padding: Spacing.three,
    borderRadius: 14,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  durationHero: {
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    gap: Spacing.half,
    overflow: 'visible',
  },
  durationValue: {
    fontSize: 36,
    fontFamily: Fonts.mono,
    lineHeight: 44,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  scoreBadge: {
    fontSize: 20,
    fontFamily: Fonts.mono,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  timeItem: {
    alignItems: 'center',
    gap: 2,
  },
  timeValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  overallScoreHero: {
    marginBottom: Spacing.two,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bodyBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
  },
  bodyBatteryItem: {
    alignItems: 'center',
    gap: 2,
  },
  bodyBatteryValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
  },
  bodyBatteryArrow: {
    fontSize: 18,
    marginTop: Spacing.three,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: Spacing.four,
  },
});
