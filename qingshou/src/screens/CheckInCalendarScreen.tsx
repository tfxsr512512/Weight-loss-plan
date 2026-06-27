import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { getCheckInRecords, getStreak } from '../db';
import { CheckInRecord } from '../types';
import { useFocusEffect } from '@react-navigation/native';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CheckInCalendarScreen() {
  const { colors } = useTheme();
  const { goal, latestWeight } = useAppData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const records = await getCheckInRecords();
    setCheckInRecords(records);
    const s = await getStreak();
    setStreak(s);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    return { daysInMonth, startWeekday, year, month };
  };

  const { daysInMonth, startWeekday, year, month } = getDaysInMonth(currentMonth);

  const getCheckInForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return checkInRecords.find(r => r.date === dateStr);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  // 统计本月打卡天数
  const monthCheckInCount = checkInRecords.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month && (r.hasWeightRecord || r.hasMealRecord || r.fastingCompleted);
  }).length;

  // 生成日历格子
  const calendarDays = [];
  
  // 填充空白格子
  for (let i = 0; i < startWeekday; i++) {
    calendarDays.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  // 填充日期格子
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const record = getCheckInForDay(day);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const hasCheckIn = record && (record.hasWeightRecord || record.hasMealRecord || record.fastingCompleted);

    calendarDays.push(
      <View key={day} style={styles.dayCell}>
        <View
          style={[
            styles.dayCircle,
            {
              backgroundColor: hasCheckIn ? colors.success : 'transparent',
              borderColor: isToday ? colors.primary : colors.borderLight,
            },
          ]}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: hasCheckIn ? 'white' : isToday ? colors.primary : colors.text,
              },
            ]}
          >
            {day}
          </Text>
        </View>
        {hasCheckIn && (
          <View style={styles.checkDot}>
            <Text style={{ fontSize: 10 }}>✓</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* 统计卡片 */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>连续打卡</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{monthCheckInCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>本月打卡</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.info }]}>
            {goal ? (goal.initialWeight - (latestWeight || goal.currentWeight)).toFixed(1) : '0'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>累计减重(kg)</Text>
        </View>
      </View>

      {/* 日历 */}
      <Card>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={[styles.monthNavBtn, { color: colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {year}年 {monthNames[month]}
          </Text>
          <TouchableOpacity onPress={nextMonth}>
            <Text style={[styles.monthNavBtn, { color: colors.text }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 星期行 */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d, i) => (
            <View key={i} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, { color: i === 0 || i === 6 ? colors.textTertiary : colors.textSecondary }]}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* 日期格子 */}
        <View style={styles.calendarGrid}>{calendarDays}</View>

        {/* 说明 */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>已打卡</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'transparent', borderColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>今天</Text>
          </View>
        </View>
      </Card>

      {/* 打卡说明 */}
      <Card>
        <CardTitle title="打卡说明" />
        <View style={styles.ruleItem}>
          <Text style={{ color: colors.success, marginRight: spacing.sm }}>✓</Text>
          <Text style={[styles.ruleText, { color: colors.textSecondary }]}>记录体重、饮食或完成断食都可打卡</Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={{ color: colors.warning, marginRight: spacing.sm }}>⚠</Text>
          <Text style={[styles.ruleText, { color: colors.textSecondary }]}>连续打卡中断后重新计算连续天数</Text>
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
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthNavBtn: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
    paddingHorizontal: spacing.md,
  },
  monthTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: fontSize.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayText: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium,
  },
  checkDot: {
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fontSize.xs,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  ruleText: {
    fontSize: fontSize.sm,
  },
});