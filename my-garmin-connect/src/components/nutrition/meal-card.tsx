import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Cherry, Moon, Sun, Sunrise, Trash2 } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Meal, MealType } from '@/types/nutrition';

interface MealCardProps {
  meal: Meal;
  onDelete?: () => void;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const MEAL_ICONS: Record<MealType, React.ComponentType<{ size: number; strokeWidth: number; color: string }>> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Cherry,
};

export function MealCard({ meal, onDelete }: MealCardProps) {
  const colors = useTheme();

  const totalCal = meal.items.reduce((sum, item) => sum + (item.calories * item.quantity / 100), 0);
  const totalProtein = meal.items.reduce((sum, item) => sum + (item.protein * item.quantity / 100), 0);
  const totalCarbs = meal.items.reduce((sum, item) => sum + (item.carbs * item.quantity / 100), 0);
  const totalFat = meal.items.reduce((sum, item) => sum + (item.fat * item.quantity / 100), 0);

  const IconComponent = MEAL_ICONS[meal.type];

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconComponent size={20} strokeWidth={2.5} color={colors.accent} />
          <View>
            <ThemedText style={styles.mealType}>{MEAL_LABELS[meal.type]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{meal.time}</ThemedText>
          </View>
        </View>
        <View style={styles.headerRight}>
          <ThemedText style={[styles.calories, { color: colors.accent }]}>
            {Math.round(totalCal)} kcal
          </ThemedText>
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
            >
              <Trash2 size={16} strokeWidth={2.5} color="#E74C3C" />
            </Pressable>
          )}
        </View>
      </View>

      {meal.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <ThemedText style={styles.itemName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.quantity}g{item.brand ? ` · ${item.brand}` : ''}
            </ThemedText>
          </View>
          <ThemedText style={styles.itemCal} themeColor="textSecondary">
            {Math.round(item.calories * item.quantity / 100)} kcal
          </ThemedText>
        </View>
      ))}

      <View style={styles.macros}>
        <MacroPill label="P" value={totalProtein} color="#3498DB" />
        <MacroPill label="G" value={totalCarbs} color="#F39C12" />
        <MacroPill label="L" value={totalFat} color="#E74C3C" />
      </View>
    </ThemedView>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '20' }]}>
      <ThemedText style={[styles.pillText, { color }]}>
        {label} {Math.round(value)}g
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mealType: {
    fontSize: 15,
    fontWeight: '600',
  },
  calories: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: Spacing.five,
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemCal: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  macros: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.mono,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(231,76,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    opacity: 0.6,
  },
});
