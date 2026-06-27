import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food, WeightRecord, MealRecord, FastingRecord, FastingPlan, Goal, UserProfile, AppSettings, CheckInRecord } from '../types';
import { initialFoods } from '../data/foods';
import { getTodayDateString } from '../utils/date';

const STORAGE_KEYS = {
  FOODS: '@qingshou_foods',
  WEIGHT_RECORDS: '@qingshou_weight',
  MEAL_RECORDS: '@qingshou_meals',
  FASTING_RECORDS: '@qingshou_fasting',
  USER_PROFILE: '@qingshou_profile',
  GOALS: '@qingshou_goals',
  FASTING_PLAN: '@qingshou_fasting_plan',
  SETTINGS: '@qingshou_settings',
  CHECK_IN: '@qingshou_checkin',
};

let memoryDB = {
  foods: [] as Food[],
  weightRecords: [] as WeightRecord[],
  mealRecords: [] as MealRecord[],
  fastingRecords: [] as FastingRecord[],
  userProfile: null as UserProfile | null,
  goals: null as Goal | null,
  fastingPlan: null as FastingPlan | null,
  settings: null as AppSettings | null,
  checkInRecords: [] as CheckInRecord[],
};

const loadFromStorage = async () => {
  try {
    const [foods, weight, meals, fasting, profile, goals, plan, settings, checkin] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.FOODS),
      AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_RECORDS),
      AsyncStorage.getItem(STORAGE_KEYS.MEAL_RECORDS),
      AsyncStorage.getItem(STORAGE_KEYS.FASTING_RECORDS),
      AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
      AsyncStorage.getItem(STORAGE_KEYS.GOALS),
      AsyncStorage.getItem(STORAGE_KEYS.FASTING_PLAN),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.CHECK_IN),
    ]);

    memoryDB.foods = foods ? JSON.parse(foods) : [];
    memoryDB.weightRecords = weight ? JSON.parse(weight) : [];
    memoryDB.mealRecords = meals ? JSON.parse(meals) : [];
    memoryDB.fastingRecords = fasting ? JSON.parse(fasting) : [];
    memoryDB.userProfile = profile ? JSON.parse(profile) : null;
    memoryDB.goals = goals ? JSON.parse(goals) : null;
    memoryDB.fastingPlan = plan ? JSON.parse(plan) : null;
    memoryDB.settings = settings ? JSON.parse(settings) : null;
    memoryDB.checkInRecords = checkin ? JSON.parse(checkin) : [];
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
};

const saveFoods = async () => AsyncStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(memoryDB.foods));
const saveWeightRecords = async () => AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(memoryDB.weightRecords));
const saveMealRecords = async () => AsyncStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(memoryDB.mealRecords));
const saveFastingRecords = async () => AsyncStorage.setItem(STORAGE_KEYS.FASTING_RECORDS, JSON.stringify(memoryDB.fastingRecords));
const saveUserProfile = async () => AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(memoryDB.userProfile));
const saveGoals = async () => AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(memoryDB.goals));
const saveFastingPlan = async () => AsyncStorage.setItem(STORAGE_KEYS.FASTING_PLAN, JSON.stringify(memoryDB.fastingPlan));
const saveSettings = async () => AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(memoryDB.settings));
const saveCheckInRecords = async () => AsyncStorage.setItem(STORAGE_KEYS.CHECK_IN, JSON.stringify(memoryDB.checkInRecords));

export const initDB = async (): Promise<void> => {
  await loadFromStorage();
  
  if (memoryDB.foods.length === 0) {
    memoryDB.foods = initialFoods.map((f, i) => ({
      ...f,
      id: `food_${i + 1}`,
      isCustom: false,
      isFavorite: false,
    }));
    await saveFoods();
  }
  
  if (!memoryDB.userProfile) {
    memoryDB.userProfile = {
      id: 'user_default',
      nickname: '',
      avatar: '',
      gender: 'unknown',
      height: 170,
      age: 25,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveUserProfile();
  }
  
  if (!memoryDB.goals) {
    memoryDB.goals = {
      initialWeight: 70,
      currentWeight: 70,
      targetWeight: 65,
      weeklyGoal: 0.5,
      targetDate: '',
      dailyCalorieTarget: 1500,
    };
    await saveGoals();
  }
  
  if (!memoryDB.fastingPlan) {
    memoryDB.fastingPlan = {
      mode: '16:8',
      fastingHours: 16,
      eatingHours: 8,
      eatingStartTime: '12:00',
      isActive: true,
    };
    await saveFastingPlan();
  }
  
  if (!memoryDB.settings) {
    memoryDB.settings = {
      theme: 'system',
      weightUnit: 'kg',
      heightUnit: 'cm',
      calorieUnit: 'kcal',
      reminderEnabled: true,
      fastingReminder: true,
      weightReminder: false,
      language: 'zh-CN',
    };
    await saveSettings();
  }
};

export const getAllFoods = async (): Promise<Food[]> => [...memoryDB.foods];
export const searchFoods = async (keyword: string): Promise<Food[]> => {
  const lower = keyword.toLowerCase();
  return memoryDB.foods
    .filter(f => f.name.toLowerCase().includes(lower))
    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || a.name.localeCompare(b.name));
};
export const getFoodsByCategory = async (category: string): Promise<Food[]> => {
  return memoryDB.foods
    .filter(f => f.category === category)
    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || a.name.localeCompare(b.name));
};
export const getFavoriteFoods = async (): Promise<Food[]> => {
  return memoryDB.foods.filter(f => f.isFavorite).sort((a, b) => a.name.localeCompare(b.name));
};
export const toggleFavoriteFood = async (foodId: string, isFavorite: boolean): Promise<void> => {
  const food = memoryDB.foods.find(f => f.id === foodId);
  if (food) {
    food.isFavorite = isFavorite;
    await saveFoods();
  }
};

export const addWeightRecord = async (weight: number, date: string, note: string = ''): Promise<void> => {
  const existing = memoryDB.weightRecords.findIndex(r => r.date === date);
  if (existing !== -1) memoryDB.weightRecords.splice(existing, 1);
  memoryDB.weightRecords.push({ id: `weight_${Date.now()}`, weight, date, note, createdAt: Date.now() });
  memoryDB.weightRecords.sort((a, b) => b.date.localeCompare(a.date));
  if (memoryDB.goals) memoryDB.goals.currentWeight = weight;
  await Promise.all([saveWeightRecords(), saveGoals()]);
  await updateCheckInRecord(date, { hasWeightRecord: true });
};
export const getWeightRecords = async (): Promise<WeightRecord[]> => [...memoryDB.weightRecords];
export const getLatestWeight = async (): Promise<number | null> => memoryDB.weightRecords[0]?.weight || null;
export const deleteWeightRecord = async (id: string): Promise<void> => {
  memoryDB.weightRecords = memoryDB.weightRecords.filter(r => r.id !== id);
  await saveWeightRecords();
};

export const addMealRecord = async (
  foodId: string, foodName: string, mealType: string, quantity: number,
  calories: number, protein: number, carbs: number, fat: number, date: string
): Promise<void> => {
  memoryDB.mealRecords.push({
    id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    foodId, foodName, mealType: mealType as any, quantity, calories, protein, carbs, fat, date, createdAt: Date.now()
  });
  await saveMealRecords();
  await updateCheckInRecord(date, { hasMealRecord: true });
};
export const getMealRecordsByDate = async (date: string): Promise<MealRecord[]> => {
  return memoryDB.mealRecords.filter(r => r.date === date).sort((a, b) => b.createdAt - a.createdAt);
};
export const deleteMealRecord = async (id: string): Promise<void> => {
  memoryDB.mealRecords = memoryDB.mealRecords.filter(r => r.id !== id);
  await saveMealRecords();
};
export const getDailyNutrition = async (date: string) => {
  const records = memoryDB.mealRecords.filter(r => r.date === date);
  return records.reduce((acc, r) => ({
    calories: acc.calories + r.calories,
    protein: acc.protein + r.protein,
    carbs: acc.carbs + r.carbs,
    fat: acc.fat + r.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

export const addFastingRecord = async (startTime: number): Promise<string> => {
  const id = `fasting_${Date.now()}`;
  memoryDB.fastingRecords.push({ id, startTime, endTime: null, status: 'active', duration: 0 });
  await saveFastingRecords();
  return id;
};
export const endFastingRecord = async (id: string, endTime: number): Promise<void> => {
  const record = memoryDB.fastingRecords.find(r => r.id === id);
  if (record) {
    record.endTime = endTime;
    record.status = 'completed';
    record.duration = Math.floor((endTime - record.startTime) / 60000);
    await Promise.all([saveFastingRecords()]);
    await updateCheckInRecord(getTodayDateString(), { fastingCompleted: true });
  }
};
export const getActiveFastingRecord = async (): Promise<FastingRecord | null> => {
  return memoryDB.fastingRecords.find(r => r.status === 'active') || null;
};
export const getFastingRecords = async (limit: number = 7): Promise<FastingRecord[]> => {
  return [...memoryDB.fastingRecords].sort((a, b) => b.startTime - a.startTime).slice(0, limit);
};
export const getFastingPlan = async (): Promise<FastingPlan | null> => memoryDB.fastingPlan;
export const updateFastingPlan = async (plan: Partial<FastingPlan>): Promise<void> => {
  if (memoryDB.fastingPlan) {
    Object.assign(memoryDB.fastingPlan, plan);
    await saveFastingPlan();
  }
};

export const getGoals = async (): Promise<Goal | null> => memoryDB.goals;
export const updateGoals = async (goals: Partial<Goal>): Promise<void> => {
  if (memoryDB.goals) {
    Object.assign(memoryDB.goals, goals);
    await saveGoals();
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => memoryDB.userProfile;
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (memoryDB.userProfile) {
    Object.assign(memoryDB.userProfile, profile, { updatedAt: Date.now() });
    await saveUserProfile();
  }
};

export const getAppSettings = async (): Promise<AppSettings | null> => memoryDB.settings;
export const updateAppSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  if (memoryDB.settings) {
    Object.assign(memoryDB.settings, settings);
    await saveSettings();
  }
};

export const getCheckInRecord = async (date: string): Promise<CheckInRecord | null> => {
  return memoryDB.checkInRecords.find(r => r.date === date) || null;
};
export const updateCheckInRecord = async (date: string, updates: Partial<CheckInRecord>): Promise<void> => {
  const existing = memoryDB.checkInRecords.find(r => r.date === date);
  if (!existing) {
    memoryDB.checkInRecords.push({
      date,
      hasWeightRecord: updates.hasWeightRecord || false,
      hasMealRecord: updates.hasMealRecord || false,
      fastingCompleted: updates.fastingCompleted || false,
      streak: updates.streak || 0,
    });
  } else {
    Object.assign(existing, updates);
  }
  await saveCheckInRecords();
};
export const getCheckInRecords = async (): Promise<CheckInRecord[]> => {
  return [...memoryDB.checkInRecords].sort((a, b) => b.date.localeCompare(a.date));
};
export const getStreak = async (): Promise<number> => {
  let streak = 0;
  const today = new Date(getTodayDateString());
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const record = memoryDB.checkInRecords.find(r => r.date === dateStr);
    if (record && (record.hasWeightRecord || record.hasMealRecord || record.fastingCompleted)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
