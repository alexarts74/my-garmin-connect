import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
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

export function ScreenHeader({ title, titleStyle }: { title: string; titleStyle?: object }) {
  const colors = useTheme();
  const { mode, setMode } = useThemeMode();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const cycleMode = () => {
    const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
    setMode(MODES[nextIndex]);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={titleStyle}>
        {title}
      </ThemedText>
      <View style={styles.buttons}>
        {isAuthenticated && (
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
            hitSlop={8}>
            <SymbolView name="person.circle" size={20} tintColor={colors.textSecondary} />
          </Pressable>
        )}
        <Pressable
          onPress={cycleMode}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.backgroundElement },
            pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
          ]}
          hitSlop={8}>
          <SymbolView name={THEME_ICONS[mode]} size={18} tintColor={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
