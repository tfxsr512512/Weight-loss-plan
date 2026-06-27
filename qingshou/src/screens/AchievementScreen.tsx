import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card, CardTitle } from '../components/Card';
import { getStreak, getWeightRecords, getFastingRecords, getMealRecords, getWaterRecordsByDate } from '../db';
import { Achievement } from '../types';
import { useFocusEffect } from '@react-navigation/native';

const achievementDefinitions = [
  { id: 'streak_3', name: '三日坚持', description: '连续打卡3天', icon: '🔥', type: 'streak' as const, target: 3 },
  { id: 'streak_7', name: '一周达人', description: '连续打卡7天', icon: '⭐', type: 'streak' as const, target: 7 },
  { id: 'streak_30', name: '月度冠军', description: '连续打卡30天', icon: '🏆', type: 'streak' as const, target: 30 },
  { id: 'streak_100', name: '百日蜕变', description: '连续打卡100天', icon: '👑', type: 'streak' as const, target: 100 },
  { id: 'weight_2', name: '初步见效', description: '累计减重2kg', icon: '💪', type: 'weight' as const, target: 2 },
  { id: 'weight_5', name: '小有成就', description: '累计减重5kg', icon: '🎯', type: 'weight' as const, target: 5 },
  { id: 'weight_10', name: '华丽蜕变', description: '累计减重10kg', icon: '🌟', type: 'weight' as const, target: 10 },
  { id: 'weight_20', name: '重生之旅', description: '累计减重20kg', icon: '🦋', type: 'weight' as const, target: 20 },
  { id: 'fasting_1', name: '初尝断食', description: '完成1次断食', icon: '⏱️', type: 'fasting' as const, target: 1 },
  { id: 'fasting_7', name: '断食达人', description: '完成7次断食', icon: '🥗', type: 'fasting' as const, target: 7 },
  { id: 'fasting_30', name: '断食大师', description: '完成30次断食', icon: '🧘', type: 'fasting' as const, target: 30 },
  { id: 'meal_1', name: '饮食新手', description: '记录第1餐', icon: '🍽️', type: 'meal' as const, target: 1 },
  { id: 'meal_7', name: '饮食达人', description: '累计记录7天饮食', icon: '🥗', type: 'meal' as const, target: 7 },
  { id: 'meal_30', name: '饮食大师', description: '累计记录30天饮食', icon: '👨‍🍳', type: 'meal' as const, target: 30 },
  { id: 'water_1', name: '喝水入门', description: '单日喝水达2000ml', icon: '💧', type: 'water' as const, target: 2000 },
  { id: 'water_7', name: '水润七天', description: '连续7天喝够水', icon: '🌊', type: 'water' as const, target: 7 },
];

export default function AchievementScreen() {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ streak: 0, totalWeightLoss: 0, fastingCount: 0, mealDays: 0, waterDays: 0 });

  const loadAchievements = useCallback(async () => {
    const streak = await getStreak();
    const weightRecords = await getWeightRecords();
    const fastingRecords = await getFastingRecords();
    const mealRecords = await getMealRecords();

    let totalWeightLoss = 0;
    if (weightRecords.length >= 2) {
      const sorted = [...weightRecords].sort((a, b) => a.date.localeCompare(b.date));
      totalWeightLoss = sorted[0].weight - sorted[sorted.length - 1].weight;
      if (totalWeightLoss < 0) totalWeightLoss = 0;
    }

    const mealDates = new Set(mealRecords.map(m => m.date));

    let waterStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const water = await getWaterRecordsByDate(dateStr);
      const total = water.reduce((s, r) => s + r.amount, 0);
      if (total >= 2000) {
        waterStreak++;
      } else {
        break;
      }
    }

    const computed: Achievement[] = achievementDefinitions.map(def => {
      let progress = 0;
      switch (def.type) {
        case 'streak':
          progress = streak;
          break;
        case 'weight':
          progress = totalWeightLoss;
          break;
        case 'fasting':
          progress = fastingRecords.filter(r => r.status === 'completed').length;
          break;
        case 'meal':
          progress = mealDates.size;
          break;
        case 'water':
          progress = waterStreak;
          break;
      }
      return {
        ...def,
        progress: Math.min(progress, def.target),
        unlocked: progress >= def.target,
      };
    });

    setAchievements(computed);
    setStats({
      streak,
      totalWeightLoss,
      fastingCount: fastingRecords.filter(r => r.status === 'completed').length,
      mealDays: mealDates.size,
      waterDays: waterStreak,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [loadAchievements])
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const categories = [
    { key: 'streak', name: '打卡成就', icon: '🔥' },
    { key: 'weight', name: '减重成就', icon: '⚖️' },
    { key: 'fasting', name: '断食成就', icon: '⏱️' },
    { key: 'meal', name: '饮食成就', icon: '🍽️' },
    { key: 'water', name: '喝水成就', icon: '💧' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.trophyIconContainer}>
            <Text style={styles.trophyIcon}>🏆</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>成就墙</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              已解锁 {unlockedCount} / {totalCount} 个成就
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <View
                style={[styles.progressFill, {
                  width: `${(unlockedCount / totalCount) * 100}%`,
                  backgroundColor: colors.primary,
                }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>连续打卡</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.statIcon}>⚖️</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.totalWeightLoss.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>累计减重 kg</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.fastingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>断食次数</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.statIcon}>🍽️</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.mealDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>饮食记录天</Text>
          </View>
        </View>
      </Card>

      {categories.map(cat => {
        const items = achievements.filter(a => a.type === cat.key);
        if (items.length === 0) return null;
        return (
          <Card key={cat.key}>
            <CardTitle title={`${cat.icon} ${cat.name}`} />
            <View style={styles.badgeGrid}>
              {items.map(ach => (
                <View key={ach.id} style={styles.badgeItem}>
                  <View style={[
                    styles.badgeIconContainer,
                    { backgroundColor: ach.unlocked ? colors.primary + '15' : colors.backgroundSecondary }
                  ]}>
                    <Text style={[styles.badgeIcon, { opacity: ach.unlocked ? 1 : 0.3 }]}>
                      {ach.icon}
                    </Text>
                  </View>
                  <Text style={[styles.badgeName, { color: ach.unlocked ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                    {ach.name}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                    {ach.description}
                  </Text>
                  <View style={[styles.badgeProgressBar, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[styles.badgeProgressFill, {
                        width: `${Math.min(100, (ach.progress / ach.target) * 100)}%`,
                        backgroundColor: ach.unlocked ? colors.success : colors.primary,
                      }]}
                    />
                  </View>
                  <Text style={[styles.badgeProgressText, { color: colors.textTertiary }]}>
                    {ach.progress} / {ach.target}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  trophyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    width: '50%',
    padding: spacing.xs,
  },
  statCardInner: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
  },
  statNum: {
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  badgeItem: {
    width: '33.33%',
    padding: spacing.xs,
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
    height: 28,
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 10,
    marginTop: 2,
  },
});
