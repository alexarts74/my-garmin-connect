import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme, useThemeMode } from '@/hooks/use-theme';
import type { ThemeMode } from '@/hooks/use-theme';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const ICONS = {
  system: 'circle.lefthalf.filled',
  light: 'sun.max.fill',
  dark: 'moon.fill',
} as const;

export function ThemeToggle() {
  const colors = useTheme();
  const { mode, setMode } = useThemeMode();
  const insets = useSafeAreaInsets();

  const cycleMode = () => {
    const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
    setMode(MODES[nextIndex]);
  };

  return (
    <Pressable
      onPress={cycleMode}
      style={({ pressed }) => [
        styles.button,
        {
          top: insets.top + Spacing.three,
          backgroundColor: colors.backgroundElement,
        },
        pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
      ]}
      hitSlop={8}>
      <SymbolView
        name={ICONS[mode]}
        size={18}
        tintColor={colors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
