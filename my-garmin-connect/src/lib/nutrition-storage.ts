import * as SQLite from 'expo-sqlite';
import type { Meal, FoodItem, MealType } from '@/types/nutrition';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getNutritionDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('nutrition.db');
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      quantity REAL NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_food_items_meal ON food_items(meal_id);
  `);
  return dbInstance;
}

export async function getMealsForDate(
  db: SQLite.SQLiteDatabase,
  date: string,
): Promise<Meal[]> {
  const mealRows = await db.getAllAsync<{
    id: string;
    date: string;
    time: string;
    type: string;
  }>('SELECT * FROM meals WHERE date = ? ORDER BY time ASC', [date]);

  const meals: Meal[] = [];
  for (const row of mealRows) {
    const items = await db.getAllAsync<{
      id: string;
      barcode: string | null;
      name: string;
      brand: string | null;
      quantity: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      image_url: string | null;
    }>('SELECT * FROM food_items WHERE meal_id = ?', [row.id]);

    meals.push({
      id: row.id,
      date: row.date,
      time: row.time,
      type: row.type as MealType,
      items: items.map((i) => ({
        id: i.id,
        barcode: i.barcode ?? undefined,
        name: i.name,
        brand: i.brand ?? undefined,
        quantity: i.quantity,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
        imageUrl: i.image_url ?? undefined,
      })),
    });
  }

  return meals;
}

export async function insertMeal(
  db: SQLite.SQLiteDatabase,
  meal: Meal,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO meals (id, date, time, type) VALUES (?, ?, ?, ?)',
    [meal.id, meal.date, meal.time, meal.type],
  );

  for (const item of meal.items) {
    await db.runAsync(
      `INSERT INTO food_items (id, meal_id, barcode, name, brand, quantity, calories, protein, carbs, fat, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        meal.id,
        item.barcode ?? null,
        item.name,
        item.brand ?? null,
        item.quantity,
        item.calories,
        item.protein,
        item.carbs,
        item.fat,
        item.imageUrl ?? null,
      ],
    );
  }
}

export async function deleteMealById(
  db: SQLite.SQLiteDatabase,
  mealId: string,
): Promise<void> {
  await db.runAsync('DELETE FROM food_items WHERE meal_id = ?', [mealId]);
  await db.runAsync('DELETE FROM meals WHERE id = ?', [mealId]);
}
