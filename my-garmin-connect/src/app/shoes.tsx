import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ShoeCard } from '@/components/shoe-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useShoes, useShoesStats } from '@/hooks/use-shoes';
import { useTheme } from '@/hooks/use-theme';
import type { Shoe } from '@/types/shoes';

export default function ShoesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { data: shoes, isLoading } = useShoes();
  const { data: stats } = useShoesStats();

  const renderItem = ({ item }: { item: Shoe }) => (
    <ShoeCard
      shoe={item}
      onPress={() => router.push({ pathname: '/shoe-form', params: { id: item.id } })}
    />
  );

  return (
    <ThemedView type="background" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}>
            <SymbolView name="xmark" size={16} tintColor={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/shoe-form')}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.accentSoft },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}>
            <SymbolView name="plus" size={16} tintColor={colors.accent} />
          </Pressable>
        </View>

        <FlatList
          data={shoes ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(300)}>
              <ThemedText style={styles.title}>Mes chaussures</ThemedText>

              {/* Stats summary */}
              {stats && (
                <ThemedView type="backgroundElement" style={styles.statsCard}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{stats.totalShoes}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">Actives</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{stats.totalKm}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">km total</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.accent }]}>
                        {stats.carbonKm}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">km carbone</ThemedText>
                    </View>
                  </View>
                </ThemedView>
              )}
            </Animated.View>
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  Aucune chaussure ajoutee.{'\n'}Appuyez sur + pour en ajouter une.
                </ThemedText>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: 0,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.three,
  },
  statsCard: {
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.mono,
  },
  empty: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  separator: {
    height: Spacing.two,
  },
});
