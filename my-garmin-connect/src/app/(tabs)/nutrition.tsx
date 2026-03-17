import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, UtensilsCrossed } from 'lucide-react-native';
import { MealCard } from '@/components/nutrition/meal-card';
import { MacroSummary } from '@/components/nutrition/macro-summary';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCaloriesBurned } from '@/hooks/use-calories-burned';
import { useNutrition } from '@/hooks/use-nutrition';
import { useTheme } from '@/hooks/use-theme';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [date] = useState(getToday);
  const { daily, isLoading, removeMeal } = useNutrition(date);
  const { caloriesBurned } = useCaloriesBurned(date);
  const colors = useTheme();
  const router = useRouter();

  if (authLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const hasMeals = daily && daily.meals.length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <ScreenHeader title="Nutrition" titleStyle={styles.title} />

            {daily && hasMeals && <MacroSummary daily={daily} caloriesBurned={caloriesBurned} />}

            {hasMeals ? (
              <View style={styles.mealsSection}>
                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                  Repas du jour
                </ThemedText>
                {daily!.meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onDelete={() => removeMeal(meal.id)}
                  />
                ))}
              </View>
            ) : (
              <ThemedView type="backgroundElement" style={styles.empty}>
                <UtensilsCrossed size={48} strokeWidth={2} color={colors.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  {"Aucun repas enregistré aujourd'hui.\nAjoute ton premier repas !"}
                </ThemedText>
              </ThemedView>
            )}

          </Animated.View>
        </ScrollView>

      </SafeAreaView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/add-meal')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent },
          pressed && styles.fabPressed,
        ]}
      >
        <Plus size={22} strokeWidth={3} color="#FFFFFF" />
      </Pressable>
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
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  mealsSection: {
    gap: Spacing.three,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  empty: {
    borderRadius: 16,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    overflow: 'visible',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.four,
    right: Spacing.four,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
