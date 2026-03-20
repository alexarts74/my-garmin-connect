import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useShoes, useShoeActions } from '@/hooks/use-shoes';
import { useTheme } from '@/hooks/use-theme';
import type { SoleType } from '@/types/shoes';

export default function ShoeFormScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: shoes } = useShoes();
  const { addShoe, editShoe, removeShoe } = useShoeActions();

  const existing = id ? shoes?.find((s) => s.id === id) : null;
  const isEditing = !!existing;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [soleType, setSoleType] = useState<SoleType>('standard');
  const [retired, setRetired] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setBrand(existing.brand);
      setSoleType(existing.soleType);
      setRetired(existing.retired);
    }
  }, [existing]);

  const canSave = name.trim().length > 0 && brand.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;

    if (isEditing) {
      editShoe.mutate(
        { id: existing.id, name: name.trim(), brand: brand.trim(), soleType, retired },
        { onSuccess: () => router.back() },
      );
    } else {
      const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      addShoe.mutate(
        { id: newId, name: name.trim(), brand: brand.trim(), soleType },
        { onSuccess: () => router.back() },
      );
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Supprimer la chaussure',
      `Supprimer "${existing.name}" ? Les associations avec les activites seront supprimees.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeShoe.mutate(existing.id, { onSuccess: () => router.back() });
          },
        },
      ],
    );
  };

  return (
    <ThemedView type="background" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}>
            <SymbolView name="xmark" size={16} tintColor={colors.textSecondary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedText style={styles.title}>
              {isEditing ? 'Modifier' : 'Nouvelle chaussure'}
            </ThemedText>

            {/* Name */}
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">Nom</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Vaporfly 3"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Brand */}
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">Marque / Modele</ThemedText>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="Ex: Nike"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Sole Type Toggle */}
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">Type de semelle</ThemedText>
              <View style={styles.toggleRow}>
                {([
                  { key: 'standard' as SoleType, label: 'Standard' },
                  { key: 'carbon' as SoleType, label: 'Carbone' },
                ]).map((option) => {
                  const isActive = soleType === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setSoleType(option.key)}
                      style={({ pressed }) => [
                        styles.toggleButton,
                        {
                          backgroundColor: isActive ? colors.accent : colors.backgroundSelected,
                        },
                        pressed && { opacity: 0.7 },
                      ]}>
                      <ThemedText
                        style={[
                          styles.toggleText,
                          { color: isActive ? '#fff' : colors.text },
                        ]}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Retired Toggle (edit only) */}
            {isEditing && (
              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">Statut</ThemedText>
                <View style={styles.toggleRow}>
                  {([
                    { key: false, label: 'Active' },
                    { key: true, label: 'Retiree' },
                  ]).map((option) => {
                    const isActive = retired === option.key;
                    return (
                      <Pressable
                        key={String(option.key)}
                        onPress={() => setRetired(option.key)}
                        style={({ pressed }) => [
                          styles.toggleButton,
                          {
                            backgroundColor: isActive
                              ? option.key ? '#E74C3C' : colors.accent
                              : colors.backgroundSelected,
                          },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <ThemedText
                          style={[
                            styles.toggleText,
                            { color: isActive ? '#fff' : colors.text },
                          ]}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: canSave ? colors.accent : colors.backgroundSelected },
                pressed && canSave && { opacity: 0.7 },
              ]}>
              <ThemedText style={[styles.saveText, { color: canSave ? '#fff' : colors.textSecondary }]}>
                {isEditing ? 'Enregistrer' : 'Ajouter'}
              </ThemedText>
            </Pressable>

            {/* Delete Button (edit only) */}
            {isEditing && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: colors.backgroundElement },
                  pressed && { opacity: 0.6 },
                ]}>
                <ThemedText style={styles.deleteText}>Supprimer</ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
  },
  field: {
    gap: Spacing.one + 2,
  },
  input: {
    borderRadius: 10,
    padding: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  deleteButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteText: {
    color: '#E74C3C',
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
});
