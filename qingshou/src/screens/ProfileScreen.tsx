import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Share, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../hooks/useAppData';
import { spacing, fontSize, fontWeights, borderRadius } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { updateUserProfile, updateGoals, updateAppSettings, getStreak, getWeightRecords, getMealRecords, getCheckInRecords } from '../db';
import { ThemeType, WeightUnit, HeightUnit } from '../types';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { userProfile, goal, settings, refreshAll, latestWeight } = useAppData();
  const [streak, setStreak] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [goalInput, setGoalInput] = useState({
    initialWeight: '',
    targetWeight: '',
    weeklyGoal: '',
    dailyCalorieTarget: '',
  });
  const [profileInput, setProfileInput] = useState({
    nickname: '',
    height: '',
    age: '',
    gender: 'unknown',
  });

  useFocusEffect(
    useCallback(() => {
      loadStreak();
    }, [])
  );

  const loadStreak = async () => {
    const s = await getStreak();
    setStreak(s);
    const checkInRecords = await getCheckInRecords();
    const validRecords = checkInRecords.filter(r => r.hasWeightRecord || r.hasMealRecord || r.fastingCompleted);
    setTotalRecords(validRecords.length);
  };

  const handleThemeChange = async (newTheme: ThemeType) => {
    await setTheme(newTheme);
  };

  const handleWeightUnitChange = async (unit: WeightUnit) => {
    await updateAppSettings({ weightUnit: unit });
    await refreshAll();
  };

  const openGoalModal = () => {
    if (goal) {
      setGoalInput({
        initialWeight: goal.initialWeight?.toString() || '',
        targetWeight: goal.targetWeight?.toString() || '',
        weeklyGoal: goal.weeklyGoal?.toString() || '',
        dailyCalorieTarget: goal.dailyCalorieTarget?.toString() || '',
      });
    }
    setShowGoalModal(true);
  };

  const saveGoal = async () => {
    const updates: any = {};
    if (goalInput.initialWeight) updates.initialWeight = parseFloat(goalInput.initialWeight);
    if (goalInput.targetWeight) updates.targetWeight = parseFloat(goalInput.targetWeight);
    if (goalInput.weeklyGoal) updates.weeklyGoal = parseFloat(goalInput.weeklyGoal);
    if (goalInput.dailyCalorieTarget) updates.dailyCalorieTarget = parseFloat(goalInput.dailyCalorieTarget);
    if (Object.keys(updates).length > 0) {
      await updateGoals(updates);
      await refreshAll();
    }
    setShowGoalModal(false);
  };

  const openProfileModal = () => {
    if (userProfile) {
      setProfileInput({
        nickname: userProfile.nickname || '',
        height: userProfile.height?.toString() || '',
        age: userProfile.age?.toString() || '',
        gender: userProfile.gender || 'unknown',
      });
    }
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    const updates: any = {
      nickname: profileInput.nickname,
      gender: profileInput.gender,
    };
    if (profileInput.height) updates.height = parseFloat(profileInput.height);
    if (profileInput.age) updates.age = parseInt(profileInput.age);
    await updateUserProfile(updates);
    await refreshAll();
    setShowProfileModal(false);
  };

  const handleExportCSV = async () => {
    try {
      const weightRecords = await getWeightRecords();
      const mealRecords = await getMealRecords();

      // 生成体重 CSV
      let weightCSV = '日期,体重(kg),备注\n';
      weightRecords.forEach(r => {
        weightCSV += `${r.date},${r.weight.toFixed(1)},${r.note || ''}\n`;
      });

      // 生成饮食 CSV
      let mealCSV = '日期,餐次,食物,份量(g),热量(kcal),蛋白质(g),碳水(g),脂肪(g)\n';
      mealRecords.forEach(r => {
        mealCSV += `${r.date},${r.mealType},${r.foodName},${r.quantity},${r.calories.toFixed(0)},${r.protein.toFixed(1)},${r.carbs.toFixed(1)},${r.fat.toFixed(1)}\n`;
      });

      const fullCSV = `=== 体重记录 ===\n${weightCSV}\n=== 饮食记录 ===\n${mealCSV}`;

      // 使用 Share 分享
      if (Platform.OS === 'web') {
        // Web 平台：下载文件
        const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `轻瘦数据导出_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('成功', '数据已导出');
      } else {
        // 移动平台：使用 Share
        await Share.share({
          message: fullCSV,
          title: '轻瘦数据导出',
        });
      }
    } catch (e) {
      Alert.alert('错误', '导出失败，请重试');
    }
  };

  const themeOptions: { key: ThemeType; label: string }[] = [
    { key: 'light', label: '浅色' },
    { key: 'dark', label: '深色' },
    { key: 'system', label: '跟随系统' },
  ];

  const weightUnitOptions: { key: WeightUnit; label: string }[] = [
    { key: 'kg', label: '公斤 (kg)' },
    { key: 'jin', label: '斤' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userProfile?.nickname ? userProfile.nickname[0] : '轻'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{userProfile?.nickname || '设置昵称'}</Text>
          <Text style={styles.profileSub}>
            {userProfile?.height ? `${userProfile.height}cm` : '设置身高'} · 
            {userProfile?.age ? ` ${userProfile.age}岁` : ' 设置年龄'}
          </Text>
        </View>
        <TouchableOpacity onPress={openProfileModal}>
          <Text style={styles.editBtn}>编辑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>连续打卡</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {goal ? (goal.initialWeight - (latestWeight || goal.currentWeight)).toFixed(1) : '0'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>累计减重(kg)</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.statValue, { color: colors.info }]}>{totalRecords}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>记录天数</Text>
        </View>
      </View>

      <Card>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} onPress={openGoalModal}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🎯</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>减肥目标设置</Text>
          </View>
          <Text style={{ color: colors.textTertiary }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('CheckInCalendar')}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📅</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>打卡日历</Text>
          </View>
          <Text style={{ color: colors.textTertiary }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('Recipe')}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📖</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>轻断食食谱</Text>
          </View>
          <Text style={{ color: colors.textTertiary }}>›</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>外观</Text>
        <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🎨</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>主题</Text>
          </View>
          <View style={styles.themeOptions}>
            {themeOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeBtn,
                  { backgroundColor: theme === opt.key ? colors.primary : colors.backgroundSecondary },
                ]}
                onPress={() => handleThemeChange(opt.key)}
              >
                <Text
                  style={{
                    color: theme === opt.key ? 'white' : colors.text,
                    fontSize: fontSize.xs,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📏</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>体重单位</Text>
          </View>
          <View style={styles.unitOptions}>
            {weightUnitOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.unitBtn,
                  { backgroundColor: settings?.weightUnit === opt.key ? colors.primary : colors.backgroundSecondary },
                ]}
                onPress={() => handleWeightUnitChange(opt.key)}
              >
                <Text
                  style={{
                    color: settings?.weightUnit === opt.key ? 'white' : colors.text,
                    fontSize: fontSize.xs,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>数据</Text>
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} 
          onPress={handleExportCSV}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📤</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>数据导出 (CSV)</Text>
          </View>
          <Text style={{ color: colors.textTertiary }}>›</Text>
        </TouchableOpacity>

        <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>断食提醒</Text>
          </View>
          <Switch
            value={settings?.fastingReminder ?? true}
            onValueChange={async (v) => {
              await updateAppSettings({ fastingReminder: v, reminderEnabled: v });
              await refreshAll();
            }}
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor={'white'}
          />
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>关于</Text>
          </View>
          <Text style={{ color: colors.textTertiary }}>v1.0.0 ›</Text>
        </TouchableOpacity>
      </Card>

      <View style={{ height: spacing.xxl }} />

      {showGoalModal && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>减肥目标</Text>
            
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.label, { color: colors.text }]}>初始体重 (kg)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={goalInput.initialWeight}
                  onChangeText={t => setGoalInput(p => ({ ...p, initialWeight: t }))}
                  placeholder="70"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>目标体重 (kg)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={goalInput.targetWeight}
                  onChangeText={t => setGoalInput(p => ({ ...p, targetWeight: t }))}
                  placeholder="65"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>每周目标减重 (kg)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={goalInput.weeklyGoal}
                  onChangeText={t => setGoalInput(p => ({ ...p, weeklyGoal: t }))}
                  placeholder="0.5"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>每日摄入热量 (kcal)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={goalInput.dailyCalorieTarget}
                  onChangeText={t => setGoalInput(p => ({ ...p, dailyCalorieTarget: t }))}
                  placeholder="1500"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowGoalModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title="保存"
                onPress={saveGoal}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {showProfileModal && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>个人信息</Text>
            
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.label, { color: colors.text }]}>昵称</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={profileInput.nickname}
                  onChangeText={t => setProfileInput(p => ({ ...p, nickname: t }))}
                  placeholder="请输入昵称"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>身高 (cm)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={profileInput.height}
                  onChangeText={t => setProfileInput(p => ({ ...p, height: t }))}
                  placeholder="170"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.label, { color: colors.text }]}>年龄</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundInput }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="numeric"
                  value={profileInput.age}
                  onChangeText={t => setProfileInput(p => ({ ...p, age: t }))}
                  placeholder="25"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowProfileModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title="保存"
                onPress={saveProfile}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nickname: {
    color: 'white',
    fontSize: fontSize.xl,
    fontWeight: fontWeights.bold,
  },
  profileSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  editBtn: {
    color: 'white',
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  statItem: {
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
  sectionHeader: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.medium,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuText: {
    fontSize: fontSize.md,
  },
  themeOptions: {
    flexDirection: 'row',
  },
  themeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginLeft: spacing.xs,
  },
  unitOptions: {
    flexDirection: 'row',
  },
  unitBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginLeft: spacing.xs,
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
    maxHeight: '80%',
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
