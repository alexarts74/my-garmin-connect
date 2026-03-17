import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import type { GarminLap } from '@/types/garmin';

interface SplitsTableProps {
  laps: GarminLap[];
}

function formatLapPace(metersPerSecond: number): string {
  if (metersPerSecond <= 0) return '--:--';
  const secondsPerKm = 1000 / metersPerSecond;
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.floor(secondsPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatLapDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SplitsTable({ laps }: SplitsTableProps) {
  if (!laps || laps.length === 0) return null;

  const paces = laps.map((l) => (l.averageSpeed > 0 ? 1000 / l.averageSpeed : Infinity));
  const bestPaceIdx = paces.indexOf(Math.min(...paces));
  const worstPaceIdx = paces.indexOf(Math.max(...paces.filter((p) => p < Infinity)));

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.colKm}>
          KM
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.colPace}>
          Allure
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.colHr}>
          FC
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.colDuration}>
          Duree
        </ThemedText>
      </View>

      {laps.map((lap, index) => {
        const isBest = index === bestPaceIdx;
        const isWorst = index === worstPaceIdx;

        return (
          <ThemedView
            key={lap.lapNumber}
            type={index % 2 === 0 ? 'backgroundElement' : 'background'}
            style={styles.row}>
            <View style={styles.colKm}>
              <ThemedText style={styles.mono}>{lap.lapNumber}</ThemedText>
            </View>
            <View style={[styles.colPace, styles.paceCell]}>
              <ThemedText
                style={[
                  styles.mono,
                  isBest && { color: '#34C759' },
                  isWorst && { color: '#FF3B30' },
                ]}>
                {formatLapPace(lap.averageSpeed)}
              </ThemedText>
              {isBest && <View style={[styles.indicator, { backgroundColor: '#34C759' }]} />}
              {isWorst && <View style={[styles.indicator, { backgroundColor: '#FF3B30' }]} />}
            </View>
            <View style={styles.colHr}>
              <ThemedText style={styles.mono}>
                {lap.averageHR > 0 ? `${lap.averageHR}` : '--'}
              </ThemedText>
            </View>
            <View style={styles.colDuration}>
              <ThemedText style={styles.mono}>
                {formatLapDuration(lap.duration)}
              </ThemedText>
            </View>
          </ThemedView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  colKm: {
    width: 40,
  },
  colPace: {
    flex: 1,
  },
  colHr: {
    width: 50,
    alignItems: 'flex-end',
  },
  colDuration: {
    width: 60,
    alignItems: 'flex-end',
  },
  paceCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
});
