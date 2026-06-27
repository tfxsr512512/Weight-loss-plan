import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { searchFoods, getFoodsByCategory, getFavoriteFoods, addMealRecord } from '../db';
import { Food, MealType } from '../types';
import { foodCategoryNames, mealTypeNames } from '../data/foods';
import { getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

const categories = [
  { key: 'staple', name: '主食', emoji: '🍚' },
  { key: 'meat', name: '肉蛋', emoji: '🍖' },
  { key: 'vegetable', name: '蔬菜', emoji: '🥬' },
  { key: 'fruit', name: '水果', emoji: '🍎' },
  { key: 'snack', name: '零食', emoji: '🍪' },
  { key: 'drink', name: '饮料', emoji: '🥤' },
];

const mealTypes: { key: MealType; name: string }[] = [
  { key: 'breakfast', name: '早餐' },
  { key: 'lunch', name: '午餐' },
  { key: 'dinner', name: '晚餐' },
  { key: 'snack', name: '加餐' },
];

export default function FoodScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { todayNutrition, refreshNutrition, goal } = useAppData();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [favorites, setFavorites] = useState<Food[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const favs = await getFavoriteFoods();
    setFavorites(favs);
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim()) {
      const results = await searchFoods(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleCategoryPress = (category: string) => {
    navigation.navigate('FoodCategory', {
      category,
      categoryName: foodCategoryNames[category] || category,
    });
  };

  const handleFoodPress = (food: Food) => {
    setSelectedFood(food);
    setQuantity(food.servingSize.toString());
    setShowFoodModal(true);
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
    setSearchText('');
    setSearchResults([]);
    await refreshNutrition();
    await loadFavorites();
  };

  const calorieTarget = goal?.dailyCalorieTarget || 1500;
  const caloriePercent = Math.min((todayNutrition.calories / calorieTarget) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundInput }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="搜索食物..."
            placeholderTextColor={colors.textTertiary}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        <Card>
          <View style={styles.calorieSummary}>
            <View>
              <Text style={[styles.calorieValue, { color: colors.text }]}>
                {Math.round(todayNutrition.calories)}
                <Text style={[styles.calorieUnit, { color: colors.textSecondary }]}> / {calorieTarget} kcal</Text>
              </Text>
            </View>
            <View style={[styles.caloriePercent, { backgroundColor: colors.primary }]}>
              <Text style={styles.caloriePercentText}>{Math.round(caloriePercent)}%</Text>
            </View>
          </View>
          <View style={[styles.calorieBarBg, { backgroundColor: colors.backgroundInput }]}>
            <View style={[styles.calorieBarFill, { width: `${caloriePercent}%`, backgroundColor: colors.primary }]} />
          </View>
        </Card>

        <View style={styles.mealTypeRow}>
          {mealTypes.map(mt => (
            <TouchableOpacity
              key={mt.key}
              style={[
                styles.mealTypeBtn,
                {
                  backgroundColor: selectedMealType === mt.key ? colors.primary : colors.backgroundCard,
                },
              ]}
              onPress={() => setSelectedMealType(mt.key)}
            >
              <Text
                style={{
                  color: selectedMealType === mt.key ? 'white' : colors.text,
                  fontWeight: selectedMealType === mt.key ? fontWeights.bold : fontWeights.regular,
                  fontSize: fontSize.sm,
                }}
              >
                {mt.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {searchText.trim() ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>搜索结果</Text>
            {searchResults.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>没有找到相关食物</Text>
            ) : (
              searchResults.slice(0, 20).map(food => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => handleFoodPress(food)}
                >
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                    <Text style={[styles.foodCal, { color: colors.textSecondary }]}>
                      {food.calories} kcal/100g
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary }}>+ 添加</Text>
                </TouchableOpacity>
              ))
            )}
          </Card>
        ) : (
          <>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>食物分类</Text>
              <View style={styles.categoryGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryItem, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleCategoryPress(cat.key)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {favorites.length > 0 && (
              <Card>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>我的收藏</Text>
                {favorites.slice(0, 5).map(food => (
                  <TouchableOpacity
                    key={food.id}
                    style={[styles.foodItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => handleFoodPress(food)}
                  >
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                      <Text style={[styles.foodCal, { color: colors.textSecondary }]}>
                        {food.calories} kcal/100g
                      </Text>
                    </View>
                    <Text style={{ color: colors.primary }}>+ 添加</Text>
                  </TouchableOpacity>
                ))}
              </Card>
            )}
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

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

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
              添加到：{mealTypeNames[selectedMealType]}
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowFoodModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title="确认添加"
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
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  calorieSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calorieValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  calorieUnit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.regular,
  },
  caloriePercent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  caloriePercentText: {
    color: 'white',
    fontWeight: fontWeights.bold,
    fontSize: fontSize.sm,
  },
  calorieBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  calorieBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  mealTypeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  categoryItem: {
    width: '33.33%',
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: fontSize.sm,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  foodCal: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: fontSize.sm,
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
