import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, Goal, FastingPlan, FastingRecord, AppSettings, DailyNutrition, WeightRecord } from '../types';
import {
  getUserProfile,
  getGoals,
  getFastingPlan,
  getActiveFastingRecord,
  getAppSettings,
  getDailyNutrition,
  getLatestWeight,
} from '../db';
import { getTodayDateString } from '../utils/date';

interface AppDataContextType {
  userProfile: UserProfile | null;
  goal: Goal | null;
  fastingPlan: FastingPlan | null;
  activeFasting: FastingRecord | null;
  settings: AppSettings | null;
  todayNutrition: DailyNutrition;
  latestWeight: number | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshNutrition: () => Promise<void>;
  refreshWeight: () => Promise<void>;
  refreshFasting: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [fastingPlan, setFastingPlan] = useState<FastingPlan | null>(null);
  const [activeFasting, setActiveFasting] = useState<FastingRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<DailyNutrition>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    const [profile, g, plan, fasting, s, nutrition, weight] = await Promise.all([
      getUserProfile(),
      getGoals(),
      getFastingPlan(),
      getActiveFastingRecord(),
      getAppSettings(),
      getDailyNutrition(getTodayDateString()),
      getLatestWeight(),
    ]);
    setUserProfile(profile);
    setGoal(g);
    setFastingPlan(plan);
    setActiveFasting(fasting);
    setSettings(s);
    setTodayNutrition(nutrition);
    setLatestWeight(weight);
    setLoading(false);
  }, []);

  const refreshNutrition = useCallback(async () => {
    const nutrition = await getDailyNutrition(getTodayDateString());
    setTodayNutrition(nutrition);
  }, []);

  const refreshWeight = useCallback(async () => {
    const [weight, g] = await Promise.all([getLatestWeight(), getGoals()]);
    setLatestWeight(weight);
    setGoal(g);
  }, []);

  const refreshFasting = useCallback(async () => {
    const [fasting, plan] = await Promise.all([getActiveFastingRecord(), getFastingPlan()]);
    setActiveFasting(fasting);
    setFastingPlan(plan);
  }, []);

  const refreshAll = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <AppDataContext.Provider
      value={{
        userProfile,
        goal,
        fastingPlan,
        activeFasting,
        settings,
        todayNutrition,
        latestWeight,
        loading,
        refreshAll,
        refreshNutrition,
        refreshWeight,
        refreshFasting,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
