import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Shoe } from '@/types/shoes';

const MAX_KM = 800;

interface ShoeCardProps {
  shoe: Shoe;
  onPress: () => void;
}

export function ShoeCard({ shoe, onPress }: ShoeCardProps) {
  const colors = useTheme();
  const km = Math.round(shoe.totalDistanceMeters / 1000);
  const progress = Math.min(km / MAX_KM, 1);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name} numberOfLines={1}>{shoe.name}</ThemedText>
            {shoe.retired && (
              <View style={[styles.pill, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={[styles.pillText, { color: colors.textSecondary }]}>
                  Retiree
                </ThemedText>
              </View>
            )}
          </View>
          <View
            style={[
              styles.pill,
              {
                backgroundColor:
                  shoe.soleType === 'carbon' ? colors.accentSoft : colors.backgroundSelected,
              },
            ]}>
            <ThemedText
              style={[
                styles.pillText,
                {
                  color: shoe.soleType === 'carbon' ? colors.accent : colors.textSecondary,
                },
              ]}>
              {shoe.soleType === 'carbon' ? 'Carbone' : 'Standard'}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary">{shoe.brand}</ThemedText>

        <View style={styles.kmRow}>
          <ThemedText style={styles.km}>{km}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary"> / {MAX_KM} km</ThemedText>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSelected }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress >= 0.9 ? '#E74C3C' : colors.accent,
              },
            ]}
          />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.one + 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    flexShrink: 1,
  },
  pill: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 1,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  kmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.one,
  },
  km: {
    fontSize: 22,
    fontFamily: Fonts.mono,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.one,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});
