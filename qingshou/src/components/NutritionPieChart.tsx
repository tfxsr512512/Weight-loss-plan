import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';

interface NutritionPieChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export function NutritionPieChart({ protein, carbs, fat, size = 100 }: NutritionPieChartProps) {
  const { colors } = useTheme();
  
  const total = protein + carbs + fat;
  const proteinPercent = total > 0 ? (protein / total) * 100 : 0;
  const carbsPercent = total > 0 ? (carbs / total) * 100 : 0;
  const fatPercent = total > 0 ? (fat / total) * 100 : 0;

  // 计算圆环各段的角度
  const proteinAngle = (proteinPercent / 100) * 360;
  const carbsAngle = (carbsPercent / 100) * 360;
  const fatAngle = (fatPercent / 100) * 360;

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyRing, { width: size, height: size, borderColor: colors.borderLight }]}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>暂无数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.legendRow]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            蛋白 {proteinPercent.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            碳水 {carbsPercent.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            脂肪 {fatPercent.toFixed(0)}%
          </Text>
        </View>
      </View>
      
      {/* 简化的比例条 */}
      <View style={[styles.barContainer, { backgroundColor: colors.backgroundInput }]}>
        <View 
          style={[
            styles.barSegment, 
            { width: `${proteinPercent}%`, backgroundColor: colors.primary }
          ]} 
        />
        <View 
          style={[
            styles.barSegment, 
            { width: `${carbsPercent}%`, backgroundColor: colors.secondary }
          ]} 
        />
        <View 
          style={[
            styles.barSegment, 
            { width: `${fatPercent}%`, backgroundColor: colors.accent }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyRing: {
    borderRadius: 999,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.xs,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fontSize.xs,
  },
  barContainer: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
});