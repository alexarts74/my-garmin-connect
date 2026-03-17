import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getServerHost(): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // On physical device or simulator, use the same host as the Expo dev server
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

const host = getServerHost();
export const API_BASE_URL = `http://${host}:3001`;

// Debug: log the URL so we can verify it's correct
console.log('[config] API_BASE_URL =', API_BASE_URL);
