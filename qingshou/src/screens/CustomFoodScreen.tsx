import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { getCustomFoods, addCustomFood, updateCustomFood, deleteCustomFood, toggleFavoriteFood } from '../db';
import { Food, FoodCategory } from '../types';
import { useFocusEffect } from '@react-navigation/native';

const categoryOptions: { key: FoodCategory; label: string; icon: string }[] = [
  { key: 'staple', label: '主食', icon: '🍚' },
  { key: 'meat', label: '肉类', icon: '🍗' },
  { key: 'vegetable', label: '蔬菜', icon: '🥬' },
  { key: 'fruit', label: '水果', icon: '🍎' },
  { key: 'snack', label: '零食', icon: '🍪' },
  { key: 'drink', label: '饮品', icon: '🥤' },
];

export default function CustomFoodScreen() {
  const { colors } = useTheme();
  const [foods, setFoods] = useState<Food[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'staple' as FoodCategory,
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    servingSize: '100',
    image: '🍽️',
  });

  const loadData = useCallback(async () => {
    const customFoods = await getCustomFoods();
    setFoods(customFoods);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const resetForm = () => {
    setForm({
      name: '',
      category: 'staple',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      servingSize: '100',
      image: '🍽️',
    });
    setEditingFood(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);
    setForm({
      name: food.name,
      category: food.category,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      fiber: food.fiber.toString(),
      servingSize: food.servingSize.toString(),
      image: food.image || '🍽️',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入食物名称');
      return;
    }
    if (!form.calories || isNaN(parseFloat(form.calories))) {
      Alert.alert('提示', '请输入有效的热量值');
      return;
    }

    const foodData = {
      name: form.name.trim(),
      category: form.category,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      fiber: parseFloat(form.fiber) || 0,
      servingSize: parseFloat(form.servingSize) || 100,
      image: form.image || '🍽️',
      isFavorite: editingFood?.isFavorite || false,
    };

    try {
      if (editingFood) {
        await updateCustomFood(editingFood.id, foodData);
      } else {
        await addCustomFood(foodData);
      }
      setShowModal(false);
      resetForm();
      await loadData();
      Alert.alert('成功', editingFood ? '食物已更新' : '食物已添加');
    } catch (e) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const handleDelete = (food: Food) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${food.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomFood(food.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (foodId: string, isFavorite: boolean) => {
    await toggleFavoriteFood(foodId, isFavorite);
    await loadData();
  };

  const getCategoryInfo = (category: string) => {
    return categoryOptions.find(c => c.key === category) || { label: '其他', icon: '🍽️' };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card>
          <CardTitle
            title="我的自定义食物"
            rightContent={
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={openAddModal}
              >
                <Text style={styles.addBtnText}>+ 添加</Text>
              </TouchableOpacity>
            }
          />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            共 {foods.length} 个自定义食物
          </Text>
        </Card>

        {foods.length === 0 ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                还没有自定义食物
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                点击上方"添加"按钮创建你的第一个自定义食物
              </Text>
              <Button
                title="添加食物"
                onPress={openAddModal}
                style={{ marginTop: spacing.lg, width: 200 }}
              />
            </View>
          </Card>
        ) : (
          foods.map((food) => {
            const catInfo = getCategoryInfo(food.category);
            return (
              <Card key={food.id} style={styles.foodCard}>
                <View style={styles.foodRow}>
                  <View style={styles.foodLeft}>
                    <Text style={styles.foodIcon}>{food.image || catInfo.icon}</Text>
                    <View style={styles.foodInfo}>
                      <View style={styles.foodNameRow}>
                        <Text style={[styles.foodName, { color: colors.text }]}>
                          {food.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(food.id, !food.isFavorite)}
                        >
                          <Text style={styles.favoriteIcon}>
                            {food.isFavorite ? '⭐' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.foodCategory, { color: colors.textSecondary }]}>
                        {catInfo.icon} {catInfo.label} · {food.servingSize}g
                      </Text>
                      <View style={styles.nutritionRow}>
                        <Text style={[styles.calorieText, { color: colors.primary }]}>
                          {food.calories} kcal
                        </Text>
                        <Text style={[styles.nutriText, { color: colors.textTertiary }]}>
                          蛋白{food.protein}g · 碳水{food.carbs}g · 脂肪{food.fat}g
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => openEditModal(food)}
                    >
                      <Text style={{ color: colors.primary, fontSize: fontSize.sm }}>编辑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => handleDelete(food)}
                    >
                      <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingFood ? '编辑食物' : '添加自定义食物'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.lg }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>食物名称 *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={form.name}
                    onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                    placeholder="例如：家常红烧肉"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>分类</Text>
                <View style={styles.categoryGrid}>
                  {categoryOptions.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryBtn,
                        {
                          backgroundColor:
                            form.category === cat.key ? colors.primary : colors.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, category: cat.key }))}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: form.category === cat.key ? 'white' : colors.text },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>份量 (g)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="numeric"
                    value={form.servingSize}
                    onChangeText={(t) => setForm((f) => ({ ...f, servingSize: t }))}
                    placeholder="100"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>热量 (kcal) *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="numeric"
                    value={form.calories}
                    onChangeText={(t) => setForm((f) => ({ ...f, calories: t }))}
                    placeholder="例如：200"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                营养成分（可选）
              </Text>

              <View style={styles.nutriGrid}>
                <View style={styles.nutriInputItem}>
                  <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>蛋白质 (g)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                    <TextInput
                      style={[styles.smallInput, { color: colors.text }]}
                      keyboardType="numeric"
                      value={form.protein}
                      onChangeText={(t) => setForm((f) => ({ ...f, protein: t }))}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
                <View style={styles.nutriInputItem}>
                  <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>碳水 (g)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                    <TextInput
                      style={[styles.smallInput, { color: colors.text }]}
                      keyboardType="numeric"
                      value={form.carbs}
                      onChangeText={(t) => setForm((f) => ({ ...f, carbs: t }))}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
                <View style={styles.nutriInputItem}>
                  <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>脂肪 (g)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                    <TextInput
                      style={[styles.smallInput, { color: colors.text }]}
                      keyboardType="numeric"
                      value={form.fat}
                      onChangeText={(t) => setForm((f) => ({ ...f, fat: t }))}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
                <View style={styles.nutriInputItem}>
                  <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>纤维 (g)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                    <TextInput
                      style={[styles.smallInput, { color: colors.text }]}
                      keyboardType="numeric"
                      value={form.fiber}
                      onChangeText={(t) => setForm((f) => ({ ...f, fiber: t }))}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="取消"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title={editingFood ? '保存修改' : '添加食物'}
                onPress={handleSave}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  addBtnText: {
    color: 'white',
    fontSize: fontSize.sm,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: -spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  foodCard: {
    marginBottom: spacing.md,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  foodLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  foodIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold,
  },
  favoriteIcon: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  foodCategory: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  nutritionRow: {
    marginTop: spacing.xs,
  },
  calorieText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.bold,
  },
  nutriText: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actionButtons: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputGroup: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.sm,
  },
  smallLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: fontSize.md,
  },
  smallInput: {
    fontSize: fontSize.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryBtn: {
    width: '31%',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
  },
  nutriGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  nutriInputItem: {
    width: '48%',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
});
