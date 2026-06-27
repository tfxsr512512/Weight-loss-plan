import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { addWeightRecord, getWeightRecords, deleteWeightRecord } from '../db';
import { WeightRecord } from '../types';
import { formatDate, getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

export default function WeightScreen() {
  const { colors } = useTheme();
  const { goal, latestWeight, userProfile, settings, refreshWeight } = useAppData();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [chartRange, setChartRange] = useState<'7' | '30' | 'all'>('7');

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const loadRecords = async () => {
    const data = await getWeightRecords();
    setRecords(data);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) {
      Alert.alert('提示', '请输入正确的体重');
      return;
    }
    await addWeightRecord(weight, getTodayDateString());
    setShowAddModal(false);
    setWeightInput('');
    await refreshWeight();
    await loadRecords();
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteWeightRecord(id);
          await refreshWeight();
          await loadRecords();
        },
      },
    ]);
  };

  const currentWeight = latestWeight || goal?.currentWeight || 0;
  const targetWeight = goal?.targetWeight || 0;
  const initialWeight = goal?.initialWeight || 0;
  const heightInMeters = (userProfile?.height || 170) / 100;
  const weightProgress = initialWeight !== targetWeight
    ? Math.max(0, (initialWeight - currentWeight) / (initialWeight - targetWeight))
    : 0;

  // BMI 计算 - 使用实际身高
  const calculateBMI = () => {
    if (!currentWeight || !heightInMeters) return '--';
    return (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMIStatus = () => {
    const bmi = parseFloat(calculateBMI());
    if (isNaN(bmi)) return { text: '--', color: colors.textSecondary };
    if (bmi < 18.5) return { text: '偏瘦', color: colors.info };
    if (bmi < 24) return { text: '正常', color: colors.success };
    if (bmi < 28) return { text: '超重', color: colors.warning };
    return { text: '肥胖', color: colors.danger };
  };

  const getChartData = () => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    let filtered = sorted;
    if (chartRange === '7') {
      filtered = sorted.slice(-7);
    } else if (chartRange === '30') {
      filtered = sorted.slice(-30);
    }
    const labels = filtered.map(r => r.date.slice(5));
    const data = filtered.map(r => r.weight);
    return { labels, data };
  };

  const chartData = getChartData();
  const screenWidth = Dimensions.get('window').width - 32;

  const bmiStatus = getBMIStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card>
          <View style={styles.currentWeightRow}>
            <View>
              <Text style={[styles.currentWeightLabel, { color: colors.textSecondary }]}>当前体重</Text>
              <Text style={[styles.currentWeightValue, { color: colors.text }]}>
                {currentWeight.toFixed(1)}
                <Text style={[styles.currentWeightUnit, { color: colors.textSecondary }]}> kg</Text>
              </Text>
            </View>
            <View style={[styles.bmiBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.bmiValue, { color: colors.text }]}>BMI {calculateBMI()}</Text>
              <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>{bmiStatus.text}</Text>
            </View>
          </View>

          {records.length >= 2 && (
            <View style={styles.changeRow}>
              <View style={styles.changeItem}>
                <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>较上次</Text>
                <Text style={[
                  styles.changeValue,
                  { color: (records[0]?.weight || 0) - (records[1]?.weight || 0) < 0 ? colors.success : colors.danger }
                ]}>
                  {(records[0]?.weight || 0) - (records[1]?.weight || 0) < 0 ? '-' : '+'}
                  {Math.abs((records[0]?.weight || 0) - (records[1]?.weight || 0)).toFixed(1)} kg
                </Text>
              </View>
              <View style={styles.changeItem}>
                <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>较初始</Text>
                <Text style={[
                  styles.changeValue,
                  { color: initialWeight - currentWeight > 0 ? colors.success : colors.danger }
                ]}>
                  {initialWeight - currentWeight >= 0 ? '-' : '+'}
                  {Math.abs(initialWeight - currentWeight).toFixed(1)} kg
                </Text>
              </View>
              {settings?.weightUnit === 'jin' && (
                <View style={styles.changeItem}>
                  <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>斤</Text>
                  <Text style={[
                    styles.changeValue,
                    { color: initialWeight - currentWeight > 0 ? colors.success : colors.danger }
                  ]}>
                    {initialWeight - currentWeight >= 0 ? '-' : '+'}
                    {(Math.abs(initialWeight - currentWeight) * 2).toFixed(1)} 斤
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        <Card>
          <CardTitle title="目标进度" />
          <View style={styles.weightGoalRow}>
            <View style={styles.weightGoalItem}>
              <Text style={[styles.weightGoalValue, { color: colors.text }]}>{initialWeight.toFixed(1)}</Text>
              <Text style={[styles.weightGoalLabel, { color: colors.textSecondary }]}>初始</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
              <ProgressBar progress={weightProgress} />
            </View>
            <View style={styles.weightGoalItem}>
              <Text style={[styles.weightGoalValue, { color: colors.primary }]}>{targetWeight.toFixed(1)}</Text>
              <Text style={[styles.weightGoalLabel, { color: colors.textSecondary }]}>目标</Text>
            </View>
          </View>
          <Text style={[styles.weightGoalTip, { color: colors.textSecondary }]}>
            已减重 {(initialWeight - currentWeight).toFixed(1)} kg，还需 {(Math.max(0, currentWeight - targetWeight)).toFixed(1)} kg
          </Text>
        </Card>

        <Card>
          <CardTitle
            title="体重趋势"
            rightContent={
              <View style={styles.rangeButtons}>
                {(['7', '30', 'all'] as const).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.rangeBtn,
                      { backgroundColor: chartRange === r ? colors.primary : 'transparent' },
                    ]}
                    onPress={() => setChartRange(r)}
                  >
                    <Text
                      style={{
                        color: chartRange === r ? 'white' : colors.textSecondary,
                        fontSize: fontSize.xs,
                        fontWeight: chartRange === r ? fontWeights.bold : fontWeights.regular,
                      }}
                    >
                      {r === '7' ? '7天' : r === '30' ? '30天' : '全部'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
          {chartData.data.length > 1 ? (
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.data }],
              }}
              width={screenWidth}
              height={200}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.backgroundCard,
                backgroundGradientTo: colors.backgroundCard,
                decimalPlaces: 1,
                color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                labelColor: (opacity = 1) => colors.textSecondary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
              }}
              bezier
              style={{ borderRadius: borderRadius.lg, marginVertical: spacing.sm }}
            />
          ) : (
            <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>至少记录2次体重才能查看趋势</Text>
            </View>
          )}
        </Card>

        <Card>
          <CardTitle title="记录列表" />
          {records.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>暂无体重记录</Text>
          ) : (
            records.map(record => (
              <TouchableOpacity
                key={record.id}
                style={[styles.recordItem, { borderBottomColor: colors.borderLight }]}
                onLongPress={() => handleDelete(record.id)}
              >
                <View>
                  <Text style={[styles.recordDate, { color: colors.text }]}>{record.date}</Text>
                  {record.note ? (
                    <Text style={[styles.recordNote, { color: colors.textSecondary }]}>{record.note}</Text>
                  ) : null}
                </View>
                <Text style={[styles.recordWeight, { color: colors.primary }]}>
                  {record.weight.toFixed(1)} kg
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setWeightInput(currentWeight ? currentWeight.toString() : '');
          setShowAddModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {showAddModal && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>记录体重</Text>
            
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.label, { color: colors.text }]}>体重（kg）</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder="请输入体重"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title="保存"
                onPress={handleAddWeight}
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
  currentWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeightLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  currentWeightValue: {
    fontSize: 40,
    fontWeight: fontWeights.extraBold,
  },
  currentWeightUnit: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.regular,
  },
  bmiBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  bmiStatus: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  weightChange: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  changeItem: {
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: fontSize.xs,
  },
  changeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  weightGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightGoalItem: {
    alignItems: 'center',
  },
  weightGoalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  weightGoalLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  weightGoalTip: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: fontSize.sm,
  },
  rangeButtons: {
    flexDirection: 'row',
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  rangeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: fontSize.sm,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recordDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  recordNote: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  recordWeight: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    fontWeight: fontWeights.bold,
    marginTop: -2,
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
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.medium,
  },
  inputWrapper: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
});
