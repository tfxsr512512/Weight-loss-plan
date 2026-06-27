import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Button } from '../components/Button';
import { getAllFoods, addMealRecord, toggleFavoriteFood } from '../db';
import { Food } from '../types';
import { getTodayDateString } from '../utils/date';
import { useAppData } from '../hooks/useAppData';

export default function FoodDetailScreen({ route, navigation }: any) {
  const { foodId } = route.params;
  const { colors } = useTheme();
  const { refreshNutrition } = useAppData();
  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  useEffect(() => {
    loadFood();
  }, [foodId]);

  const loadFood = async () => {
    const allFoods = await getAllFoods();
    const found = allFoods.find((f: any) => f.id === foodId);
    if (found) {
      setFood(found);
      setQuantity(found.servingSize.toString());
      navigation.setOptions({ title: found.name });
    }
  };

  const handleToggleFavorite = async () => {
    if (!food) return;
    await toggleFavoriteFood(food.id, !food.isFavorite);
    await loadFood();
  };

  const handleAddMeal = async () => {
    if (!food) return;
    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) return;
    const factor = qty / 100;
    await addMealRecord(
      food.id,
      food.name,
      mealType,
      qty,
      food.calories * factor,
      food.protein * factor,
      food.carbs * factor,
      food.fat * factor,
      getTodayDateString()
    );
    await refreshNutrition();
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 1500);
  };

  if (!food) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const factor = (parseFloat(quantity) || 0) / 100;

  const mealTypes = [
    { key: 'breakfast', name: '早餐' },
    { key: 'lunch', name: '午餐' },
    { key: 'dinner', name: '晚餐' },
    { key: 'snack', name: '加餐' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.foodImage, { backgroundColor: colors.primary }]}>
        <Text style={styles.foodEmoji}>🍽️</Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        <View style={styles.headerRow}>
          <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Text style={{ fontSize: 28 }}>{food.isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.calorieText, { color: colors.primary }]}>
          {food.calories} kcal / 100g
        </Text>

        <View style={[styles.portionSection, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>份量</Text>
          <View style={[styles.quantityInput, { backgroundColor: colors.backgroundInput }]}>
            <TextInput
              style={[styles.quantityText, { color: colors.text }]}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>g</Text>
          </View>
        </View>

        <View style={[styles.nutritionCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>营养成分</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                {(food.calories * factor).toFixed(0)}
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>热量 (kcal)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {(food.protein * factor).toFixed(1)}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>蛋白质</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {(food.carbs * factor).toFixed(1)}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>碳水化合物</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {(food.fat * factor).toFixed(1)}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>脂肪</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {(food.fiber * factor).toFixed(1)}g
              </Text>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>膳食纤维</Text>
            </View>
          </View>
        </View>

        <View style={[styles.mealTypeCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>添加到</Text>
          <View style={styles.mealTypeRow}>
            {mealTypes.map(mt => (
              <TouchableOpacity
                key={mt.key}
                style={[
                  styles.mealTypeBtn,
                  {
                    backgroundColor: mealType === mt.key ? colors.primary : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setMealType(mt.key as any)}
              >
                <Text
                  style={{
                    color: mealType === mt.key ? 'white' : colors.text,
                    fontSize: fontSize.sm,
                    fontWeight: mealType === mt.key ? fontWeights.bold : fontWeights.regular,
                  }}
                >
                  {mt.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="添加到今日饮食"
          onPress={handleAddMeal}
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </View>

      {showAddSuccess && (
        <View style={[styles.toast, { backgroundColor: colors.success }]}>
          <Text style={styles.toastText}>✓ 添加成功</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  foodImage: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodEmoji: {
    fontSize: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  foodName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  calorieText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.md,
  },
  portionSection: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  nutritionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    width: '50%',
    padding: spacing.sm,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  nutritionLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  mealTypeCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  mealTypeRow: {
    flexDirection: 'row',
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: borderRadius.md,
  },
  toast: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -60 }],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
  },
  toastText: {
    color: 'white',
    fontWeight: fontWeights.bold,
  },
});
