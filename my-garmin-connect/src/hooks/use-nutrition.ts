import { useCallback, useEffect, useState } from 'react';
import {
  getNutritionDB,
  getMealsForDate,
  insertMeal,
  deleteMealById,
} from '@/lib/nutrition-storage';
import type { Meal, DailyNutrition, FoodItem } from '@/types/nutrition';

function computeDailyTotals(date: string, meals: Meal[]): DailyNutrition {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const meal of meals) {
    for (const item of meal.items) {
      const ratio = item.quantity / 100;
      totalCalories += item.calories * ratio;
      totalProtein += item.protein * ratio;
      totalCarbs += item.carbs * ratio;
      totalFat += item.fat * ratio;
    }
  }

  return {
    date,
    meals,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFat: Math.round(totalFat),
  };
}

export function useNutrition(date: string) {
  const [daily, setDaily] = useState<DailyNutrition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const db = await getNutritionDB();
      const meals = await getMealsForDate(db, date);
      setDaily(computeDailyTotals(date, meals));
    } catch (e) {
      console.error('[nutrition] load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMeal = useCallback(
    async (meal: Meal) => {
      const db = await getNutritionDB();
      await insertMeal(db, meal);
      await refresh();
    },
    [refresh],
  );

  const removeMeal = useCallback(
    async (mealId: string) => {
      const db = await getNutritionDB();
      await deleteMealById(db, mealId);
      await refresh();
    },
    [refresh],
  );

  return { daily, isLoading, refresh, addMeal, removeMeal };
}
