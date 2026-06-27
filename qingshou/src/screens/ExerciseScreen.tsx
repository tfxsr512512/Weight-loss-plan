import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { addExerciseRecord, getExerciseRecordsByDate, getDailyExerciseCalories, deleteExerciseRecord } from '../db';
import { ExerciseRecord, ExerciseType } from '../types';
import { getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

const exerciseTypes: { type: ExerciseType; name: string; icon: string; caloriesPerHour: number }[] = [
  { type: 'walking', name: '散步', icon: '🚶', caloriesPerHour: 250 },
  { type: 'running', name: '跑步', icon: '🏃', caloriesPerHour: 500 },
  { type: 'cycling', name: '骑行', icon: '🚴', caloriesPerHour: 400 },
  { type: 'swimming', name: '游泳', icon: '🏊', caloriesPerHour: 550 },
  { type: 'yoga', name: '瑜伽', icon: '🧘', caloriesPerHour: 200 },
  { type: 'other', name: '其他', icon: '💪', caloriesPerHour: 300 },
];

export default function ExerciseScreen() {
  const { colors } = useTheme();
  const [todayCalories, setTodayCalories] = useState(0);
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ExerciseType>('walking');
  const [durationInput, setDurationInput] = useState('30');
  const [nameInput, setNameInput] = useState('');

  const loadData = useCallback(async () => {
    const today = getTodayDateString();
    const cals = await getDailyExerciseCalories(today);
    setTodayCalories(cals);
    const recs = await getExerciseRecordsByDate(today);
    setRecords(recs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddExercise = async () => {
    const duration = parseFloat(durationInput) || 0;
    if (duration <= 0) return;
    const typeInfo = exerciseTypes.find(t => t.type === selectedType);
    const name = nameInput || typeInfo?.name || '运动';
    await addExerciseRecord(name, selectedType, duration);
    setShowAddModal(false);
    setDurationInput('30');
    setNameInput('');
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteExerciseRecord(id);
    await loadData();
  };

  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Card>
        <CardTitle title="今日运动" />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {Math.round(todayCalories)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>消耗卡路里</Text>
            <Text style={[styles.statUnit, { color: colors.textTertiary }]}>kcal</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {totalDuration}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>运动时长</Text>
            <Text style={[styles.statUnit, { color: colors.textTertiary }]}>分钟</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {records.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>运动项目</Text>
            <Text style={[styles.statUnit, { color: colors.textTertiary }]}>项</Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle title="快速添加" />
        <View style={styles.typeGrid}>
          {exerciseTypes.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeCard,
                {
                  backgroundColor: selectedType === item.type ? colors.primary + '15' : colors.backgroundSecondary,
                  borderWidth: selectedType === item.type ? 2 : 0,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setSelectedType(item.type);
                setNameInput(item.name);
                setShowAddModal(true);
              }}
            >
              <Text style={styles.typeIcon}>{item.icon}</Text>
              <Text style={[styles.typeName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.typeCal, { color: colors.textTertiary }]}>{item.caloriesPerHour} kcal/h</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle title={`今日记录 (${records.length}条)`} />
        {records.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            还没有运动记录，开始运动吧~
          </Text>
        ) : (
          records.map((record, idx) => {
            const typeInfo = exerciseTypes.find(t => t.type === record.type);
            return (
              <View
                key={record.id}
                style={[styles.recordItem, { borderBottomColor: colors.borderLight, borderBottomWidth: idx < records.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
              >
                <View style={styles.recordLeft}>
                  <Text style={styles.recordIcon}>{typeInfo?.icon || '💪'}</Text>
                  <View>
                    <Text style={[styles.recordName, { color: colors.text }]}>{record.name}</Text>
                    <Text style={[styles.recordDetail, { color: colors.textTertiary }]}>
                      {record.duration} 分钟 · {Math.round(record.calories)} kcal
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(record.id)}>
                  <Text style={{ color: colors.textTertiary, fontSize: fontSize.md }}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </Card>

      <View style={{ height: spacing.xxl }} />

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>添加运动记录</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>运动类型</Text>
            <View style={styles.typeSelectRow}>
              {exerciseTypes.slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeSelectBtn,
                    {
                      backgroundColor: selectedType === item.type ? colors.primary : colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedType(item.type);
                    setNameInput(item.name);
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      color: selectedType === item.type ? 'white' : colors.text,
                      marginTop: 2,
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>运动名称</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="请输入运动名称"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>运动时长（分钟）</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
              keyboardType="numeric"
              value={durationInput}
              onChangeText={setDurationInput}
              placeholder="请输入时长"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.calorieHintRow}>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.sm }}>预计消耗：</Text>
              <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeights.bold }}>
                {Math.round((parseFloat(durationInput) || 0) * (exerciseTypes.find(t => t.type === selectedType)?.caloriesPerHour || 300) / 60)} kcal
              </Text>
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
                onPress={handleAddExercise}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeights.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statUnit: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  typeCard: {
    width: '33.33%',
    padding: spacing.sm,
  },
  typeCardInner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 32,
  },
  typeName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  typeCal: {
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
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
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  recordName: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  recordDetail: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  typeSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  typeSelectBtn: {
    width: '33.33%',
    padding: spacing.xs,
  },
  typeSelectInner: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  calorieHintRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});
