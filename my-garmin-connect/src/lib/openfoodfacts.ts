import type { OpenFoodFactsProduct, FoodItem } from '@/types/nutrition';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export async function fetchProductByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`${BASE_URL}/product/${barcode}.json`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product as OpenFoodFactsProduct;
    const n = p.nutriments ?? {};

    return {
      id: barcode + '_' + Date.now(),
      barcode,
      name: p.product_name || 'Produit inconnu',
      brand: p.brands || undefined,
      quantity: 100, // default to 100g
      calories: n['energy-kcal_100g'] ?? 0,
      protein: n.proteins_100g ?? 0,
      carbs: n.carbohydrates_100g ?? 0,
      fat: n.fat_100g ?? 0,
      imageUrl: p.image_url || undefined,
    };
  } catch (e) {
    console.error('[openfoodfacts] fetch error:', e);
    return null;
  }
}

export async function searchProducts(query: string): Promise<FoodItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=10&json=1`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    const products: OpenFoodFactsProduct[] = data.products ?? [];

    return products
      .filter((p) => p.product_name)
      .map((p) => {
        const n = p.nutriments ?? {};
        return {
          id: (p.code || '') + '_' + Date.now(),
          barcode: p.code,
          name: p.product_name,
          brand: p.brands || undefined,
          quantity: 100,
          calories: n['energy-kcal_100g'] ?? 0,
          protein: n.proteins_100g ?? 0,
          carbs: n.carbohydrates_100g ?? 0,
          fat: n.fat_100g ?? 0,
          imageUrl: p.image_url || undefined,
        };
      });
  } catch (e) {
    console.error('[openfoodfacts] search error:', e);
    return [];
  }
}
