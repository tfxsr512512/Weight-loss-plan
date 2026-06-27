import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import {
  addPeriodRecord,
  getPeriodCycles,
  deletePeriodRecord,
  getAverageCycleLength,
  getAveragePeriodDuration,
  isInPeriod,
} from '../db';
import { PeriodCycle } from '../types';
import { getTodayDateString } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

export default function PeriodScreen() {
  const { colors } = useTheme();
  const [cycles, setCycles] = useState<PeriodCycle[]>([]);
  const [avgCycleLength, setAvgCycleLength] = useState<number | null>(null);
  const [avgDuration, setAvgDuration] = useState<number | null>(null);
  const [inPeriod, setInPeriod] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);

  const loadData = useCallback(async () => {
    const cycleList = await getPeriodCycles();
    setCycles(cycleList);

    const avgLen = await getAverageCycleLength();
    setAvgCycleLength(avgLen);

    const avgDur = await getAveragePeriodDuration();
    setAvgDuration(avgDur);

    const today = getTodayDateString();
    const isPeriod = await isInPeriod(today);
    setInPeriod(isPeriod);

    if (isPeriod && cycleList.length > 0) {
      const currentCycle = cycleList.find(c => !c.endDate);
      if (currentCycle) {
        const start = new Date(currentCycle.startDate);
        const now = new Date(today);
        const days = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setCurrentDay(days);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMarkStart = () => {
    Alert.alert(
      '标记经期开始',
      '确定要将今天标记为经期开始吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            const today = getTodayDateString();
            await addPeriodRecord(today, 'start');
            await loadData();
          },
        },
      ]
    );
  };

  const handleMarkEnd = () => {
    Alert.alert(
      '标记经期结束',
      '确定要将今天标记为经期结束吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            const today = getTodayDateString();
            await addPeriodRecord(today, 'end');
            await loadData();
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getNextPeriodPrediction = () => {
    if (!avgCycleLength || cycles.length === 0) return null;
    const lastStart = cycles.find(c => c.startDate)?.startDate;
    if (!lastStart) return null;
    const lastStartDate = new Date(lastStart);
    const nextDate = new Date(lastStartDate);
    nextDate.setDate(nextDate.getDate() + avgCycleLength);
    return nextDate.toISOString().split('T')[0];
  };

  const nextPeriod = getNextPeriodPrediction();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Card>
        <CardTitle title="经期状态" />
        <View style={[styles.statusCard, { backgroundColor: inPeriod ? '#FFE4E6' : '#F0FDF4' }]}>
          <Text style={styles.statusIcon}>{inPeriod ? '🩸' : '🌸'}</Text>
          <Text style={[styles.statusText, { color: inPeriod ? '#E11D48' : '#16A34A' }]}>
            {inPeriod ? `经期第 ${currentDay} 天` : '非经期'}
          </Text>
          {inPeriod && avgDuration && (
            <Text style={[styles.statusSubtext, { color: '#E11D48' }]}>
              平均持续 {avgDuration} 天
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          {!inPeriod ? (
            <Button
              title="标记经期开始"
              onPress={handleMarkStart}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title="标记经期结束"
              onPress={handleMarkEnd}
              variant="outline"
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Card>

      <Card>
        <CardTitle title="数据统计" />
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {avgCycleLength || '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              平均周期(天)
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {avgDuration || '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              平均持续(天)
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {cycles.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              记录次数
            </Text>
          </View>
        </View>
      </Card>

      {nextPeriod && (
        <Card>
          <CardTitle title="下次预测" />
          <View style={styles.predictionRow}>
            <Text style={styles.predictionIcon}>📅</Text>
            <View>
              <Text style={[styles.predictionText, { color: colors.text }]}>
                预计 {formatDate(nextPeriod)} 左右
              </Text>
              <Text style={[styles.predictionSub, { color: colors.textTertiary }]}>
                基于平均周期 {avgCycleLength} 天预测
              </Text>
            </View>
          </View>
        </Card>
      )}

      <Card>
        <CardTitle title="历史记录" />
        {cycles.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            还没有经期记录，点击上方按钮开始记录吧~
          </Text>
        ) : (
          cycles.map((cycle, index) => (
            <View
              key={index}
              style={[
                styles.cycleItem,
                { borderBottomColor: colors.borderLight },
                index < cycles.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.cycleLeft}>
                <Text style={styles.cycleIcon}>
                  {cycle.endDate ? '✅' : '🔴'}
                </Text>
                <View>
                  <Text style={[styles.cycleDate, { color: colors.text }]}>
                    {formatDate(cycle.startDate)} - {cycle.endDate ? formatDate(cycle.endDate) : '进行中'}
                  </Text>
                  <Text style={[styles.cycleInfo, { color: colors.textSecondary }]}>
                    {cycle.duration ? `持续 ${cycle.duration} 天` : '进行中'}
                  </Text>
                </View>
              </View>
              {cycle.endDate && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      '删除记录',
                      '确定要删除这条经期记录吗？',
                      [
                        { text: '取消', style: 'cancel' },
                        {
                          text: '删除',
                          style: 'destructive',
                          onPress: async () => {
                            const records = await (await import('../db')).getPeriodRecords();
                            const startRecord = records.find(r => r.date === cycle.startDate && r.type === 'start');
                            const endRecord = records.find(r => r.date === cycle.endDate && r.type === 'end');
                            if (startRecord) await deletePeriodRecord(startRecord.id);
                            if (endRecord) await deletePeriodRecord(endRecord.id);
                            await loadData();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: colors.textTertiary, fontSize: fontSize.md }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle title="温馨提示" />
        <View style={styles.tipItem}>
          <Text style={{ marginRight: spacing.sm }}>💡</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            记录经期有助于了解身体规律，更好地规划减肥节奏
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={{ marginRight: spacing.sm }}>🥗</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            经期可以适当放松饮食，避免过度节食影响健康
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={{ marginRight: spacing.sm }}>🏃‍♀️</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            经期建议轻度运动，如散步、瑜伽等舒缓运动
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
  statusCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  statusSubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  predictionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  predictionSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: fontSize.sm,
  },
  cycleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cycleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cycleIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  cycleDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  cycleInfo: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
