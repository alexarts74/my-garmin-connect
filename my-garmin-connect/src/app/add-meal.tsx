import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, ScanBarcode, X } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNutrition } from '@/hooks/use-nutrition';
import { searchProducts, fetchProductByBarcode } from '@/lib/openfoodfacts';
import type { FoodItem, MealType } from '@/types/nutrition';

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Petit-déj' },
  { key: 'lunch', label: 'Déjeuner' },
  { key: 'dinner', label: 'Dîner' },
  { key: 'snack', label: 'Collation' },
];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getNow(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const QUANTITY_PRESETS = [50, 100, 150, 200];

export default function AddMealScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { barcode: scannedBarcode } = useLocalSearchParams<{ barcode?: string }>();
  const [date] = useState(getToday);
  const { addMeal } = useNutrition(date);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const lastScannedBarcode = useRef<string | null>(null);

  // Handle barcode from scanner
  useEffect(() => {
    if (scannedBarcode && scannedBarcode !== lastScannedBarcode.current) {
      lastScannedBarcode.current = scannedBarcode;
      setBarcodeInput(scannedBarcode);
      (async () => {
        setIsSearching(true);
        const item = await fetchProductByBarcode(scannedBarcode);
        if (item) {
          setSearchResults([item]);
        } else {
          Alert.alert('Produit non trouvé', 'Aucun produit avec ce code-barres.');
        }
        setIsSearching(false);
      })();
    }
  }, [scannedBarcode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchProducts(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    setIsSearching(true);
    const item = await fetchProductByBarcode(barcodeInput.trim());
    if (item) {
      setSearchResults([item]);
    } else {
      Alert.alert('Produit non trouvé', 'Aucun produit avec ce code-barres.');
    }
    setIsSearching(false);
  };

  const addItem = (item: FoodItem) => {
    setSelectedItems((prev) => [...prev, { ...item, id: item.id + '_' + Date.now() }]);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  };

  const saveMeal = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Aucun aliment', 'Ajoute au moins un aliment.');
      return;
    }

    await addMeal({
      id: 'meal_' + Date.now(),
      date,
      time: getNow(),
      type: mealType,
      items: selectedItems,
    });

    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Ajouter un repas
              </ThemedText>
              <Pressable onPress={() => router.back()}>
                <ThemedText style={{ color: colors.accent }}>Annuler</ThemedText>
              </Pressable>
            </View>

            {/* Meal type selector */}
            <View style={styles.typeRow}>
              {MEAL_TYPES.map((t) => (
                <Pressable key={t.key} onPress={() => setMealType(t.key)}>
                  <ThemedView
                    type={mealType === t.key ? undefined : 'backgroundElement'}
                    style={[
                      styles.typePill,
                      mealType === t.key && { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={mealType === t.key ? { color: colors.accent, fontWeight: '700' } : undefined}
                      themeColor={mealType === t.key ? undefined : 'textSecondary'}
                    >
                      {t.label}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            {/* Search */}
            <ThemedView type="backgroundElement" style={styles.searchSection}>
              <ThemedText type="smallBold">Rechercher un aliment</ThemedText>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
                  placeholder="Ex: pain complet, yaourt..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={handleSearch}
                  style={[styles.searchButton, { backgroundColor: colors.accent }]}
                >
                  <ThemedText style={styles.searchButtonText}>Chercher</ThemedText>
                </Pressable>
              </View>

              <ThemedText type="smallBold" style={styles.orLabel}>ou code-barres</ThemedText>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
                  placeholder="3017620422003"
                  placeholderTextColor={colors.textSecondary}
                  value={barcodeInput}
                  onChangeText={setBarcodeInput}
                  onSubmitEditing={handleBarcodeLookup}
                  keyboardType="number-pad"
                  returnKeyType="search"
                />
                <Pressable
                  onPress={handleBarcodeLookup}
                  style={[styles.searchButton, { backgroundColor: colors.accent }]}
                >
                  <ThemedText style={styles.searchButtonText}>OK</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/scan-barcode')}
                  style={[styles.scanButton, { backgroundColor: colors.accent }]}
                >
                  <ScanBarcode size={16} strokeWidth={2.5} color="#FFFFFF" />
                </Pressable>
              </View>
            </ThemedView>

            {/* Search results */}
            {isSearching && <ActivityIndicator style={styles.loader} />}

            {searchResults.length > 0 && (
              <View style={styles.resultsSection}>
                <ThemedText type="smallBold">Résultats</ThemedText>
                {searchResults.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => addItem(item)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <ThemedView type="backgroundElement" style={styles.resultCard}>
                      <View style={styles.resultInfo}>
                        <ThemedText style={styles.resultName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.brand ? `${item.brand} · ` : ''}{item.calories} kcal/100g
                        </ThemedText>
                      </View>
                      <Plus size={18} strokeWidth={2.5} color={colors.accent} />
                    </ThemedView>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Selected items */}
            {selectedItems.length > 0 && (
              <View style={styles.selectedSection}>
                <ThemedText type="smallBold" style={{ color: colors.accent }}>
                  Aliments sélectionnés ({selectedItems.length})
                </ThemedText>
                {selectedItems.map((item) => (
                  <ThemedView key={item.id} type="backgroundElement" style={styles.selectedItem}>
                    <View style={styles.selectedItemContent}>
                      <View style={styles.selectedItemHeader}>
                        <View style={styles.resultInfo}>
                          <ThemedText style={styles.resultName} numberOfLines={1}>
                            {item.name}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {Math.round(item.calories * item.quantity / 100)} kcal
                          </ThemedText>
                        </View>
                        <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton}>
                          <X size={14} strokeWidth={3} color="#E74C3C" />
                        </Pressable>
                      </View>
                      <View style={styles.quantityRow}>
                        <View style={styles.quantityInputRow}>
                          <TextInput
                            style={[styles.quantityInput, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
                            value={String(item.quantity)}
                            onChangeText={(text) => {
                              const num = parseInt(text, 10);
                              if (!isNaN(num) && num > 0) {
                                updateItemQuantity(item.id, num);
                              } else if (text === '') {
                                updateItemQuantity(item.id, 0);
                              }
                            }}
                            keyboardType="number-pad"
                            selectTextOnFocus
                          />
                          <ThemedText type="small" themeColor="textSecondary">g</ThemedText>
                        </View>
                        <View style={styles.presetRow}>
                          {QUANTITY_PRESETS.map((preset) => (
                            <Pressable
                              key={preset}
                              onPress={() => updateItemQuantity(item.id, preset)}
                              style={({ pressed }) => [
                                styles.presetPill,
                                {
                                  backgroundColor: item.quantity === preset ? colors.accentSoft : colors.backgroundSelected,
                                },
                                pressed && styles.pressed,
                              ]}
                            >
                              <ThemedText
                                type="small"
                                style={item.quantity === preset ? { color: colors.accent, fontWeight: '700' } : undefined}
                                themeColor={item.quantity === preset ? undefined : 'textSecondary'}
                              >
                                {preset}g
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </View>
                  </ThemedView>
                ))}
              </View>
            )}

            {/* Save button */}
            <Pressable
              onPress={saveMeal}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: selectedItems.length > 0 ? colors.accent : colors.backgroundSelected },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.saveText}>
                Enregistrer le repas
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typePill: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 20,
  },
  searchSection: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  searchButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orLabel: {
    marginTop: Spacing.one,
  },
  loader: {
    marginVertical: Spacing.three,
  },
  resultsSection: {
    gap: Spacing.two,
  },
  resultCard: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSection: {
    gap: Spacing.two,
  },
  selectedItem: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  selectedItemContent: {
    gap: Spacing.two,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityInput: {
    width: 60,
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  presetPill: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(231,76,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
});
