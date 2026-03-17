import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_KEY = 'theme_mode';

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'system',
  setMode: () => {},
  resolvedTheme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    SecureStore.setItemAsync(THEME_MODE_KEY, newMode);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  if (!loaded) return null;

  return React.createElement(
    ThemeModeContext.Provider,
    { value: { mode, setMode, resolvedTheme } },
    children,
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function useTheme() {
  const { resolvedTheme } = useThemeMode();
  return Colors[resolvedTheme];
}
