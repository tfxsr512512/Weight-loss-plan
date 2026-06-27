import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { formatTime, formatDurationHMS, getTodayDateString } from '../utils/date';

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { goal, activeFasting, fastingPlan, todayNutrition, latestWeight, refreshAll, loading } = useAppData();
  const [refreshing, setRefreshing] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const isFasting = activeFasting?.status === 'active';
  const currentWeight = latestWeight || goal?.currentWeight || 0;
  const targetWeight = goal?.targetWeight || 0;
  const initialWeight = goal?.initialWeight || 0;
  
  const weightProgress = initialWeight !== targetWeight
    ? (initialWeight - currentWeight) / (initialWeight - targetWeight)
    : 0;

  const calorieTarget = goal?.dailyCalorieTarget || 1500;
  const calorieProgress = todayNutrition.calories / calorieTarget;

  let fastingProgress = 0;
  let fastingTimeLeft = '';
  let fastingEndTime = '';
  
  if (isFasting && activeFasting && fastingPlan) {
    const elapsed = (now - activeFasting.startTime) / 1000;
    const totalSeconds = fastingPlan.fastingHours * 3600;
    fastingProgress = Math.min(elapsed / totalSeconds, 1);
    const left = Math.max(totalSeconds - elapsed, 0);
    fastingTimeLeft = formatDurationHMS(left);
    fastingEndTime = formatTime(activeFasting.startTime + totalSeconds * 1000);
  }

  const bmi = currentWeight && goal 
    ? (currentWeight / Math.pow((170) / 100, 2)).toFixed(1)
    : '--';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>你好呀 👋</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {getTodayDateString()} · BMI {bmi}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>轻</Text>
        </View>
      </View>

      <Card>
        <CardTitle
          title="今日断食"
          rightContent={
            <TouchableOpacity onPress={() => navigation.navigate('Fasting')}>
              <Text style={{ color: colors.primary, fontSize: fontSize.sm }}>详情</Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.fastingContent}>
          <View style={styles.fastingInfo}>
            <View style={[styles.statusBadge, { backgroundColor: isFasting ? colors.fasting : colors.eating }]}>
              <Text style={styles.statusText}>{isFasting ? '断食中' : '进食中'}</Text>
            </View>
            {isFasting ? (
              <>
                <Text style={[styles.timeLeft, { color: colors.text }]}>{fastingTimeLeft}</Text>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  预计结束 {fastingEndTime}
                </Text>
              </>
            ) : (
              <Text style={[styles.timeLeft, { color: colors.text }]}>--:--:--</Text>
            )}
          </View>
          <View style={{ flex: 1 }} />
          <Button
            title={isFasting ? '结束断食' : '开始断食'}
            onPress={() => navigation.navigate('Fasting')}
            size="sm"
          />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar progress={fastingProgress} color={isFasting ? colors.fasting : colors.eating} />
        </View>
      </Card>

      <Card>
        <CardTitle title="体重进度" />
        <View style={styles.weightRow}>
          <View style={styles.weightItem}>
            <Text style={[styles.weightValue, { color: colors.text }]}>{currentWeight.toFixed(1)}</Text>
            <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>当前 (kg)</Text>
          </View>
          <View style={styles.weightArrow}>
            <Text style={{ color: colors.textTertiary, fontSize: 20 }}>→</Text>
          </View>
          <View style={styles.weightItem}>
            <Text style={[styles.weightValue, { color: colors.primary }]}>{targetWeight.toFixed(1)}</Text>
            <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>目标 (kg)</Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar progress={weightProgress} showText label="减重进度" />
        </View>
        <Text style={[styles.weightTip, { color: colors.textSecondary }]}>
          已减重 {(initialWeight - currentWeight).toFixed(1)} kg，还需 {(currentWeight - targetWeight).toFixed(1)} kg
        </Text>
        <Button
          title="记录体重"
          onPress={() => navigation.navigate('Weight')}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Card>
        <CardTitle title="今日热量" />
        <View style={styles.calorieHeader}>
          <View>
            <Text style={[styles.calorieValue, { color: colors.text }]}>
              {Math.round(todayNutrition.calories)}
              <Text style={[styles.calorieUnit, { color: colors.textSecondary }]}> / {calorieTarget} kcal</Text>
            </Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <ProgressBar progress={calorieProgress} />
        </View>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.macroText, { color: colors.textSecondary }]}>
              蛋白 {todayNutrition.protein.toFixed(0)}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.macroText, { color: colors.textSecondary }]}>
              碳水 {todayNutrition.carbs.toFixed(0)}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.macroText, { color: colors.textSecondary }]}>
              脂肪 {todayNutrition.fat.toFixed(0)}g
            </Text>
          </View>
        </View>
        <Button
          title="记录饮食"
          onPress={() => navigation.navigate('Food')}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  date: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: fontWeights.bold,
    fontSize: fontSize.lg,
  },
  fastingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fastingInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginBottom: spacing.sm,
  },
  statusText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: fontWeights.bold,
  },
  timeLeft: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeights.extraBold,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightItem: {
    flex: 1,
    alignItems: 'center',
  },
  weightValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeights.bold,
  },
  weightLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  weightArrow: {
    paddingHorizontal: spacing.md,
  },
  weightTip: {
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  calorieUnit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.regular,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    justifyContent: 'space-around',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  macroText: {
    fontSize: fontSize.xs,
  },
});
