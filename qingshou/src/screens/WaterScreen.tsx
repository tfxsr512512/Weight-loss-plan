import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { addWaterRecord, getDailyWaterAmount, getWaterRecordsByDate, deleteWaterRecord } from '../db';
import { WaterRecord } from '../types';
import { getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

const WATER_CUP = 250;
const DAILY_GOAL = 2000;

const quickAddOptions = [
  { amount: 250, label: '一杯', icon: '🥤' },
  { amount: 500, label: '一瓶', icon: '🍶' },
  { amount: 100, label: '一小口', icon: '💧' },
];

export default function WaterScreen() {
  const { colors } = useTheme();
  const [todayAmount, setTodayAmount] = useState(0);
  const [records, setRecords] = useState<WaterRecord[]>([]);

  const loadData = useCallback(async () => {
    const today = getTodayDateString();
    const amount = await getDailyWaterAmount(today);
    setTodayAmount(amount);
    const recs = await getWaterRecordsByDate(today);
    setRecords(recs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddWater = async (amount: number) => {
    await addWaterRecord(amount);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteWaterRecord(id);
    await loadData();
  };

  const progress = Math.min(todayAmount / DAILY_GOAL, 1);
  const cups = Math.floor(todayAmount / WATER_CUP);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Card>
        <CardTitle title="今日饮水" />
        <View style={styles.waterCircleContainer}>
          <View style={[styles.waterCircle, { borderColor: colors.borderLight }]}>
            <View
              style={[
                styles.waterFill,
                {
                  height: `${progress * 100}%`,
                  backgroundColor: colors.info,
                },
              ]}
            />
            <View style={styles.waterTextOverlay}>
              <Text style={[styles.waterAmount, { color: colors.text }]}>{todayAmount}</Text>
              <Text style={[styles.waterUnit, { color: colors.textSecondary }]}>ml / {DAILY_GOAL}ml</Text>
              <Text style={[styles.waterPercent, { color: colors.info }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cupRow}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.cupItem}>
              <Text style={{ fontSize: 20, opacity: i < cups ? 1 : 0.2 }}>🥤</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cupTip, { color: colors.textTertiary }]}>
          {cups} / 8 杯
        </Text>
      </Card>

      <Card>
        <CardTitle title="快速添加" />
        <View style={styles.quickAddRow}>
          {quickAddOptions.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.quickAddBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleAddWater(opt.amount)}
            >
              <Text style={styles.quickAddIcon}>{opt.icon}</Text>
              <Text style={[styles.quickAddLabel, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.quickAddAmount, { color: colors.info }]}>+{opt.amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle title={`今日记录 (${records.length}条)`} />
        {records.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            还没有喝水记录，快来喝一杯吧~
          </Text>
        ) : (
          records.map((record, idx) => (
            <View
              key={record.id}
              style={[styles.recordItem, { borderBottomColor: colors.borderLight, borderBottomWidth: idx < records.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
            >
              <View style={styles.recordLeft}>
                <Text style={styles.recordIcon}>💧</Text>
                <View>
                  <Text style={[styles.recordAmount, { color: colors.text }]}>+{record.amount} ml</Text>
                  <Text style={[styles.recordTime, { color: colors.textTertiary }]}>
                    {new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(record.id)}>
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.md }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle title="喝水小贴士" />
        <View style={styles.tipItem}>
          <Text style={{ color: colors.info, marginRight: spacing.sm }}>💡</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            成年人每天建议饮水 1500-2000ml
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={{ color: colors.info, marginRight: spacing.sm }}>⏰</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            早上起床后喝一杯温水，促进新陈代谢
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={{ color: colors.info, marginRight: spacing.sm }}>🍽️</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            餐前喝一杯水，有助于增加饱腹感
          </Text>
        </View>
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waterCircleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  waterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  waterTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeights.bold,
  },
  waterUnit: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  waterPercent: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  cupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  cupItem: {
    marginHorizontal: spacing.xs,
  },
  cupTip: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  quickAddRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  quickAddBtn: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  quickAddIcon: {
    fontSize: 28,
  },
  quickAddLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  quickAddAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeights.bold,
    marginTop: 2,
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
    fontSize: 20,
    marginRight: spacing.sm,
  },
  recordAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  recordTime: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
