import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Button } from '../components/Button';
import { getFoodsByCategory, toggleFavoriteFood, addMealRecord } from '../db';
import { Food, MealType } from '../types';
import { getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

export default function FoodCategoryScreen({ route, navigation }: any) {
  const { category, categoryName } = route.params;
  const { colors } = useTheme();
  const { refreshNutrition } = useAppData();
  const [foods, setFoods] = useState<Food[]>([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [navigation, categoryName]);

  useFocusEffect(
    useCallback(() => {
      loadFoods();
    }, [category])
  );

  const loadFoods = async () => {
    const data = await getFoodsByCategory(category);
    setFoods(data);
  };

  const handleFoodPress = (food: Food) => {
    setSelectedFood(food);
    setQuantity(food.servingSize.toString());
    setShowFoodModal(true);
  };

  const handleToggleFavorite = async (food: Food) => {
    await toggleFavoriteFood(food.id, !food.isFavorite);
    await loadFoods();
  };

  const handleAddMeal = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      Alert.alert('提示', '请输入正确的份量');
      return;
    }
    const factor = qty / 100;
    await addMealRecord(
      selectedFood.id,
      selectedFood.name,
      selectedMealType,
      qty,
      selectedFood.calories * factor,
      selectedFood.protein * factor,
      selectedFood.carbs * factor,
      selectedFood.fat * factor,
      getTodayDateString()
    );
    setShowFoodModal(false);
    await refreshNutrition();
  };

  const renderItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={[styles.foodItem, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.borderLight }]}
      onPress={() => handleFoodPress(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
          {item.calories} kcal/100g · 蛋白{item.protein}g · 碳水{item.carbs}g · 脂肪{item.fat}g
        </Text>
      </View>
      <TouchableOpacity style={styles.favBtn} onPress={() => handleToggleFavorite(item)}>
        <Text style={{ fontSize: 20 }}>{item.isFavorite ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <FlatList
        data={foods}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md }}
      />

      {showFoodModal && selectedFood && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedFood.name}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedFood.calories} kcal/100g
            </Text>
            
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.label, { color: colors.text }]}>份量（克）</Text>
              <View style={[styles.quantityInput, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.quantityText, { color: colors.text }]}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <Text style={{ color: colors.textSecondary }}>g</Text>
              </View>
            </View>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                  {((parseFloat(quantity) || 0) / 100 * selectedFood.calories).toFixed(0)}
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>热量(kcal)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {((parseFloat(quantity) || 0) / 100 * selectedFood.protein).toFixed(1)}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>蛋白</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {((parseFloat(quantity) || 0) / 100 * selectedFood.carbs).toFixed(1)}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {((parseFloat(quantity) || 0) / 100 * selectedFood.fat).toFixed(1)}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>脂肪</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowFoodModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title="添加"
                onPress={handleAddMeal}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  foodDetail: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  favBtn: {
    padding: spacing.sm,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.medium,
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  quantityText: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginHorizontal: -spacing.xs,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  nutritionValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold,
  },
  nutritionLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
});
