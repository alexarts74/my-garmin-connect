export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  quantity: number; // grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: MealType;
  items: FoodItem[];
}

export interface DailyNutrition {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  image_url?: string;
}
