import * as SecureStore from 'expo-secure-store';
import type { GarminTokens } from '@/types/garmin';

const TOKENS_KEY = 'garmin_tokens';

export async function saveTokens(tokens: GarminTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<GarminTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as GarminTokens;
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}
