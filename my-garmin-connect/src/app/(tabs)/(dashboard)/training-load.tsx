import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTrainingLoad } from '@/hooks/use-training-load';
import { useTheme } from '@/hooks/use-theme';
import { getReadinessColor, formatTSB } from '@/lib/training-insights';

export default function TrainingLoadScreen() {
  const { data, isLoading, refetch, isRefetching } = useTrainingLoad();
  const colors = useTheme();

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Données non disponibles</ThemedText>
      </ThemedView>
    );
  }

  const readinessColor = getReadinessColor(data.readinessLevel);

  // Chart data
  const atlData = data.history.map((h) => ({ value: h.atl, label: '' }));
  const ctlData = data.history.map((h) => ({ value: h.ctl, label: '' }));
  const tsbData = data.history.map((h) => ({ value: h.tsb, label: '' }));

  // Show labels every 7 days
  const labeledAtlData = atlData.map((d, i) => ({
    ...d,
    label: i % 7 === 0 ? data.history[i].date.slice(5) : '',
  }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            {/* Hero score */}
            <View style={styles.heroSection}>
              <View style={[styles.heroBadge, { backgroundColor: readinessColor + '20' }]}>
                <Text style={[styles.heroScore, { color: readinessColor }]}>
                  {data.recoveryScore}
                </Text>
              </View>
              <ThemedText style={styles.heroLabel}>{data.readinessLabel}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Score de récupération
              </ThemedText>
            </View>

            {/* Key metrics */}
            <View style={styles.metricsRow}>
              <MetricCard label="ATL" sublabel="Aiguë" value={data.currentATL.toFixed(1)} />
              <MetricCard label="CTL" sublabel="Chronique" value={data.currentCTL.toFixed(1)} />
              <MetricCard
                label="TSB"
                sublabel="Balance"
                value={formatTSB(data.currentTSB)}
                valueColor={data.currentTSB >= 0 ? '#2ECC71' : '#E74C3C'}
              />
            </View>

            {/* ATL / CTL chart */}
            <ThemedView type="backgroundElement" style={styles.chartCard}>
              <ThemedText type="smallBold" style={styles.chartTitle}>
                Charge d'entraînement (42 jours)
              </ThemedText>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#E74C3C' }]} />
                  <ThemedText style={styles.legendText} themeColor="textSecondary">ATL (aiguë)</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                  <ThemedText style={styles.legendText} themeColor="textSecondary">CTL (chronique)</ThemedText>
                </View>
              </View>
              <LineChart
                data={labeledAtlData}
                data2={ctlData}
                color1="#E74C3C"
                color2="#3498DB"
                height={180}
                thickness={2}
                spacing={8}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                curved
                hideDataPoints
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                noOfSections={4}
                isAnimated
                animationDuration={300}
              />
            </ThemedView>

            {/* TSB chart */}
            <ThemedView type="backgroundElement" style={styles.chartCard}>
              <ThemedText type="smallBold" style={styles.chartTitle}>
                Balance (TSB)
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Positif = frais · Négatif = fatigué
              </ThemedText>
              <LineChart
                data={tsbData}
                color={colors.accent}
                height={180}
                thickness={2}
                spacing={8}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                curved
                hideDataPoints
                areaChart
                startFillColor={colors.accent}
                startOpacity={0.15}
                endOpacity={0}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                noOfSections={4}
                isAnimated
                animationDuration={300}
              />
            </ThemedView>

            {/* Factors */}
            <ThemedView type="backgroundElement" style={styles.factorsCard}>
              <ThemedText type="smallBold" style={styles.chartTitle}>
                Facteurs
              </ThemedText>
              {data.factors.map((f, i) => (
                <View key={i} style={styles.factorRow}>
                  <ThemedText style={styles.factorBullet} themeColor="textSecondary">•</ThemedText>
                  <ThemedText type="small">{f}</ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* Insights */}
            {data.insights.length > 0 && (
              <ThemedView type="backgroundElement" style={styles.factorsCard}>
                <ThemedText type="smallBold" style={[styles.chartTitle, { color: colors.accent }]}>
                  Insights
                </ThemedText>
                {data.insights.map((insight, i) => (
                  <ThemedText key={i} type="small" style={styles.insight}>
                    {insight}
                  </ThemedText>
                ))}
              </ThemedView>
            )}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

function MetricCard({
  label,
  sublabel,
  value,
  valueColor,
}: {
  label: string;
  sublabel: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.metricCard}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={[styles.metricValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </ThemedText>
      <ThemedText style={styles.metricSublabel} themeColor="textSecondary" numberOfLines={1}>
        {sublabel}
      </ThemedText>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  heroBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScore: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    letterSpacing: -1,
  },
  heroLabel: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  metricSublabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  chartTitle: {
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  factorsCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  factorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  factorBullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  insight: {
    lineHeight: 22,
  },
});
