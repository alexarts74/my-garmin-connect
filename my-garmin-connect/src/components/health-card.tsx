import React, { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HealthCardProps {
  symbolName: ComponentProps<typeof SymbolView>['name'];
  value: string;
  unit?: string;
  label: string;
  onPress?: () => void;
}

export function HealthCard({ symbolName, value, unit, label, onPress }: HealthCardProps) {
  const colors = useTheme();

  const cardContent = (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
        <SymbolView
          name={symbolName}
          size={18}
          tintColor={colors.accent}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{value}</ThemedText>
          {unit && (
            <ThemedText style={styles.unit} themeColor="textSecondary">
              {unit}
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
    </ThemedView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.half,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
  },
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
