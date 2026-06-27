import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';

interface Recipe {
  name: string;
  ingredients: { name: string; amount: string }[];
  calories: number;
}

const weeklyRecipes: Record<number, { breakfast: Recipe; lunch: Recipe; dinner: Recipe }> = {
  0: { // 周一
    breakfast: {
      name: '燕麦牛奶粥',
      ingredients: [{ name: '燕麦', amount: '50g' }, { name: '牛奶', amount: '250ml' }, { name: '蓝莓', amount: '30g' }],
      calories: 280,
    },
    lunch: {
      name: '鸡胸肉蔬菜沙拉',
      ingredients: [{ name: '鸡胸肉', amount: '150g' }, { name: '生菜', amount: '100g' }, { name: '西兰花', amount: '100g' }, { name: '橄榄油', amount: '10ml' }],
      calories: 350,
    },
    dinner: {
      name: '清蒸鱼配糙米饭',
      ingredients: [{ name: '鳕鱼', amount: '150g' }, { name: '糙米饭', amount: '150g' }, { name: '青菜', amount: '200g' }],
      calories: 380,
    },
  },
  1: { // 周二
    breakfast: {
      name: '全麦面包鸡蛋',
      ingredients: [{ name: '全麦面包', amount: '2片' }, { name: '鸡蛋', amount: '1个' }, { name: '牛奶', amount: '250ml' }],
      calories: 320,
    },
    lunch: {
      name: '番茄牛肉面',
      ingredients: [{ name: '瘦牛肉', amount: '100g' }, { name: '面条', amount: '150g' }, { name: '番茄', amount: '150g' }],
      calories: 420,
    },
    dinner: {
      name: '虾仁炒时蔬',
      ingredients: [{ name: '虾仁', amount: '100g' }, { name: '西兰花', amount: '150g' }, { name: '胡萝卜', amount: '100g' }],
      calories: 280,
    },
  },
  2: { // 周三
    breakfast: {
      name: '杂粮粥配鸡蛋',
      ingredients: [{ name: '小米', amount: '30g' }, { name: '燕麦', amount: '30g' }, { name: '鸡蛋', amount: '1个' }],
      calories: 260,
    },
    lunch: {
      name: '三文鱼沙拉',
      ingredients: [{ name: '三文鱼', amount: '100g' }, { name: '生菜', amount: '100g' }, { name: '牛油果', amount: '50g' }],
      calories: 380,
    },
    dinner: {
      name: '蔬菜汤配馒头',
      ingredients: [{ name: '馒头', amount: '1个' }, { name: '大白菜', amount: '200g' }, { name: '豆腐', amount: '100g' }],
      calories: 320,
    },
  },
  3: { // 周四
    breakfast: {
      name: '豆浆配红薯',
      ingredients: [{ name: '豆浆', amount: '300ml' }, { name: '红薯', amount: '150g' }],
      calories: 220,
    },
    lunch: {
      name: '鸡肉卷',
      ingredients: [{ name: '鸡胸肉', amount: '100g' }, { name: '全麦饼', amount: '1张' }, { name: '生菜', amount: '50g' }],
      calories: 350,
    },
    dinner: {
      name: '清炒蔬菜配米饭',
      ingredients: [{ name: '白米饭', amount: '150g' }, { name: '青椒', amount: '100g' }, { name: '豆角', amount: '150g' }],
      calories: 380,
    },
  },
  4: { // 周五
    breakfast: {
      name: '酸奶水果杯',
      ingredients: [{ name: '酸奶', amount: '200g' }, { name: '香蕉', amount: '1根' }, { name: '草莓', amount: '50g' }],
      calories: 280,
    },
    lunch: {
      name: '蘑菇炒牛肉',
      ingredients: [{ name: '瘦牛肉', amount: '100g' }, { name: '蘑菇', amount: '100g' }, { name: '糙米饭', amount: '150g' }],
      calories: 400,
    },
    dinner: {
      name: '豆腐蔬菜煲',
      ingredients: [{ name: '豆腐', amount: '150g' }, { name: '冬瓜', amount: '200g' }, { name: '香菇', amount: '50g' }],
      calories: 250,
    },
  },
  5: { // 周六
    breakfast: {
      name: '蔬菜鸡蛋饼',
      ingredients: [{ name: '鸡蛋', amount: '2个' }, { name: '菠菜', amount: '50g' }, { name: '面粉', amount: '30g' }],
      calories: 300,
    },
    lunch: {
      name: '海鲜汤面',
      ingredients: [{ name: '面条', amount: '150g' }, { name: '虾', amount: '100g' }, { name: '青菜', amount: '100g' }],
      calories: 380,
    },
    dinner: {
      name: '烤蔬菜配米饭',
      ingredients: [{ name: '白米饭', amount: '150g' }, { name: '茄子', amount: '100g' }, { name: '南瓜', amount: '100g' }],
      calories: 350,
    },
  },
  6: { // 周日
    breakfast: {
      name: '小米粥配包子',
      ingredients: [{ name: '小米粥', amount: '300ml' }, { name: '素包子', amount: '1个' }],
      calories: 280,
    },
    lunch: {
      name: '清蒸鸡配蔬菜',
      ingredients: [{ name: '鸡腿肉', amount: '100g' }, { name: '芦笋', amount: '100g' }, { name: '西兰花', amount: '100g' }],
      calories: 320,
    },
    dinner: {
      name: '水果沙拉配酸奶',
      ingredients: [{ name: '苹果', amount: '1个' }, { name: '橙子', amount: '1个' }, { name: '酸奶', amount: '150g' }],
      calories: 200,
    },
  },
};

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

export default function RecipeScreen() {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState(0);

  const dayRecipe = weeklyRecipes[selectedDay];
  const totalCalories = dayRecipe.breakfast.calories + dayRecipe.lunch.calories + dayRecipe.dinner.calories;

  const renderMealCard = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const recipe = dayRecipe[mealType];
    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.mealHeader}>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{mealNames[mealType]}</Text>
          <Text style={[styles.mealCalories, { color: colors.primary }]}>{recipe.calories} kcal</Text>
        </View>
        <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
        <View style={styles.ingredientsList}>
          {recipe.ingredients.map((ing, idx) => (
            <View key={idx} style={styles.ingredientItem}>
              <Text style={[styles.ingredientName, { color: colors.textSecondary }]}>{ing.name}</Text>
              <Text style={[styles.ingredientAmount, { color: colors.textTertiary }]}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* 一周切换 */}
      <View style={[styles.dayTabBar, { backgroundColor: colors.backgroundCard }]}>
        {dayNames.map((name, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.dayTab,
              { backgroundColor: selectedDay === idx ? colors.primary : 'transparent' },
            ]}
            onPress={() => setSelectedDay(idx)}
          >
            <Text
              style={{
                color: selectedDay === idx ? 'white' : colors.text,
                fontSize: fontSize.sm,
                fontWeight: selectedDay === idx ? fontWeights.bold : fontWeights.regular,
              }}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 总热量 */}
      <View style={[styles.totalCard, { backgroundColor: colors.backgroundCard }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>今日推荐摄入</Text>
        <Text style={[styles.totalCalories, { color: colors.primary }]}>
          {totalCalories} kcal
        </Text>
      </View>

      {/* 三餐 */}
      {renderMealCard('breakfast')}
      {renderMealCard('lunch')}
      {renderMealCard('dinner')}

      {/* 提示 */}
      <Card>
        <Text style={[styles.tipTitle, { color: colors.text }]}>温馨提示</Text>
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          • 食谱仅供参考，可根据个人喜好调整食材{'\n'}
          • 热量可根据运动量适当增减{'\n'}
          • 断食期间请按进食窗口安排用餐时间{'\n'}
          • 建议每餐细嚼慢咽，增加饱腹感
        </Text>
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayTabBar: {
    flexDirection: 'row',
    margin: spacing.lg,
    borderRadius: borderRadius.round,
    padding: spacing.xs,
  },
  dayTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.round,
  },
  totalCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
  },
  totalCalories: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  mealCalories: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  recipeName: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.md,
  },
  ingredientsList: {},
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  ingredientName: {
    fontSize: fontSize.sm,
  },
  ingredientAmount: {
    fontSize: fontSize.sm,
  },
  tipTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
});