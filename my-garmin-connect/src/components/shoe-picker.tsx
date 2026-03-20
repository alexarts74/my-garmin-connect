import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useShoes } from '@/hooks/use-shoes';
import { SymbolView } from 'expo-symbols';
import type { Shoe } from '@/types/shoes';

interface ShoePickerProps {
  visible: boolean;
  selectedShoeId?: string | null;
  onSelect: (shoe: Shoe | null) => void;
  onClose: () => void;
}

export function ShoePicker({ visible, selectedShoeId, onSelect, onClose }: ShoePickerProps) {
  const colors = useTheme();
  const { data: shoes } = useShoes();

  const activeShoes = shoes?.filter((s) => !s.retired) ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView type="background" style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Chaussure</ThemedText>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}>
            <SymbolView name="xmark" size={14} tintColor={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {/* None option */}
          <Pressable
            onPress={() => onSelect(null)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText style={styles.rowName}>Aucune</ThemedText>
              {!selectedShoeId && (
                <SymbolView name="checkmark" size={16} tintColor={colors.accent} />
              )}
            </ThemedView>
          </Pressable>

          {activeShoes.map((shoe) => {
            const isSelected = shoe.id === selectedShoeId;
            const km = Math.round(shoe.totalDistanceMeters / 1000);
            return (
              <Pressable
                key={shoe.id}
                onPress={() => onSelect(shoe)}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <View style={styles.rowInfo}>
                    <ThemedText style={styles.rowName}>{shoe.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {km} km
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <SymbolView name="checkmark" size={16} tintColor={colors.accent} />
                  )}
                </ThemedView>
              </Pressable>
            );
          })}

          {activeShoes.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Aucune chaussure ajoutee. Ajoutez-en depuis votre profil.
            </ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.semiBold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  empty: {
    textAlign: 'center',
    padding: Spacing.four,
  },
});
