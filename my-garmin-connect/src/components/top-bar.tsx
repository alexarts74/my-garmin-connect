import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme, useThemeMode } from '@/hooks/use-theme';
import type { ThemeMode } from '@/hooks/use-theme';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_ICONS = {
  system: 'circle.lefthalf.filled',
  light: 'sun.max.fill',
  dark: 'moon.fill',
} as const;

export function TopBar() {
  const colors = useTheme();
  const { mode, setMode } = useThemeMode();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const cycleMode = () => {
    const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
    setMode(MODES[nextIndex]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.two,
          backgroundColor: colors.background,
        },
      ]}
      pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        {/* Profile icon */}
        {isAuthenticated && (
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
            hitSlop={8}>
            <SymbolView
              name="person.circle"
              size={20}
              tintColor={colors.textSecondary}
            />
          </Pressable>
        )}

        {/* Theme toggle */}
        <Pressable
          onPress={cycleMode}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.backgroundElement },
            pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
          ]}
          hitSlop={8}>
          <SymbolView
            name={THEME_ICONS[mode]}
            size={18}
            tintColor={colors.accent}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
