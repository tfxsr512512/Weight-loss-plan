import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { addFastingRecord, endFastingRecord, updateFastingPlan, getFastingRecords } from '../db';
import { FastingMode, FastingRecord } from '../types';
import { formatDurationHMS, formatTime, formatDate } from '../utils/date';
import { useFocusEffect } from '@react-navigation/native';

const fastingModes: { mode: FastingMode; fasting: number; eating: number; label: string }[] = [
  { mode: '16:8', fasting: 16, eating: 8, label: '16:8' },
  { mode: '18:6', fasting: 18, eating: 6, label: '18:6' },
  { mode: '20:4', fasting: 20, eating: 4, label: '20:4' },
  { mode: 'OMAD', fasting: 23, eating: 1, label: 'OMAD' },
];

export default function FastingScreen() {
  const { colors } = useTheme();
  const { activeFasting, fastingPlan, refreshFasting } = useAppData();
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState<FastingRecord[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const records = await getFastingRecords(7);
    setHistory(records);
  };

  const isFasting = activeFasting?.status === 'active';
  
  let progress = 0;
  let timeLeft = '';
  let elapsed = '';
  let endTime = '';
  
  if (isFasting && activeFasting && fastingPlan) {
    const elapsedSec = (now - activeFasting.startTime) / 1000;
    const totalSec = fastingPlan.fastingHours * 3600;
    progress = Math.min(elapsedSec / totalSec, 1);
    const left = Math.max(totalSec - elapsedSec, 0);
    timeLeft = formatDurationHMS(left);
    elapsed = formatDurationHMS(elapsedSec);
    endTime = formatTime(activeFasting.startTime + totalSec * 1000);
  }

  const handleStartFasting = async () => {
    await addFastingRecord(Date.now());
    await refreshFasting();
    await loadHistory();
  };

  const handleEndFasting = async () => {
    if (!activeFasting) return;
    await endFastingRecord(activeFasting.id, Date.now());
    await refreshFasting();
    await loadHistory();
  };

  const handleModeChange = async (mode: FastingMode, fasting: number, eating: number) => {
    if (isFasting) return;
    await updateFastingPlan({
      mode,
      fastingHours: fasting,
      eatingHours: eating,
    });
    await refreshFasting();
  };

  const currentMode = fastingPlan?.mode || '16:8';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Card>
        <View style={styles.timerSection}>
          <View style={[styles.statusBadge, { backgroundColor: isFasting ? colors.fasting : colors.eating }]}>
            <Text style={styles.statusText}>{isFasting ? '断食中' : '进食中'}</Text>
          </View>

          <View style={[styles.timerCircle, { borderColor: isFasting ? colors.fasting : colors.eating }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {isFasting ? timeLeft : '--:--:--'}
            </Text>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              {isFasting ? '距离结束' : '未开始'}
            </Text>
          </View>

          {isFasting && (
            <View style={styles.timeInfoRow}>
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeInfoValue, { color: colors.text }]}>{elapsed}</Text>
                <Text style={[styles.timeInfoLabel, { color: colors.textSecondary }]}>已断食</Text>
              </View>
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeInfoValue, { color: colors.text }]}>{endTime}</Text>
                <Text style={[styles.timeInfoLabel, { color: colors.textSecondary }]}>结束时间</Text>
              </View>
            </View>
          )}

          <Button
            title={isFasting ? '结束断食' : '开始断食'}
            onPress={isFasting ? handleEndFasting : handleStartFasting}
            size="lg"
            style={{ marginTop: spacing.xl, width: '100%' }}
          />
        </View>
      </Card>

      <Card>
        <CardTitle title="断食模式" />
        <View style={styles.modeGrid}>
          {fastingModes.map(m => (
            <TouchableOpacity
              key={m.mode}
              style={[
                styles.modeItem,
                {
                  backgroundColor: currentMode === m.mode ? colors.primary : colors.backgroundSecondary,
                  borderColor: currentMode === m.mode ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleModeChange(m.mode, m.fasting, m.eating)}
              disabled={isFasting}
            >
              <Text
                style={{
                  color: currentMode === m.mode ? 'white' : colors.text,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeights.bold as '700',
                }}
              >
                {m.label}
              </Text>
              <Text
                style={{
                  color: currentMode === m.mode ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                  fontSize: fontSize.xs,
                  marginTop: 2,
                }}
              >
                断{m.fasting}h / 吃{m.eating}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.eatingWindow, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.eatingWindowLabel, { color: colors.textSecondary }]}>进食窗口</Text>
          {fastingPlan && (
            <Text style={[styles.eatingWindowTime, { color: colors.text }]}>
              {fastingPlan.eatingStartTime} - {formatTime(
                new Date().setHours(
                  parseInt(fastingPlan.eatingStartTime.split(':')[0]) + fastingPlan.eatingHours,
                  parseInt(fastingPlan.eatingStartTime.split(':')[1])
                )
              )}
            </Text>
          )}
        </View>
      </Card>

      <Card>
        <CardTitle title="最近记录" />
        {history.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>暂无断食记录</Text>
        ) : (
          history.map(record => (
            <View key={record.id} style={[styles.historyItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.historyDate, { color: colors.text }]}>
                  {formatDate(record.startTime)}
                </Text>
                <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                  {formatTime(record.startTime)} - {record.endTime ? formatTime(record.endTime) : '进行中'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyDuration, { color: colors.primary }]}>
                  {record.duration > 0 ? `${Math.floor(record.duration / 60)}h${record.duration % 60}m` : '--'}
                </Text>
                <Text style={[styles.historyStatus, { color: record.status === 'completed' ? colors.success : colors.fasting }]}>
                  {record.status === 'completed' ? '已完成' : record.status === 'active' ? '进行中' : '已取消'}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xl,
  },
  statusText: {
    color: 'white',
    fontWeight: fontWeights.bold as '700',
    fontSize: fontSize.md,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  timerText: {
    fontSize: 36,
    fontWeight: fontWeights.extraBold as '800',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  timeInfoRow: {
    flexDirection: 'row',
    width: '100%',
  },
  timeInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeInfoValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeights.bold as '700',
    fontVariant: ['tabular-nums'],
  },
  timeInfoLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  modeItem: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    margin: spacing.xs,
    borderWidth: 1,
  },
  eatingWindow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  eatingWindowLabel: {
    fontSize: fontSize.sm,
  },
  eatingWindowTime: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold as '700',
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: fontSize.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.medium as '500',
  },
  historyTime: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  historyDuration: {
    fontSize: fontSize.md,
    fontWeight: fontWeights.bold as '700',
  },
  historyStatus: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
