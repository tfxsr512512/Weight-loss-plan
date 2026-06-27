import { Food, WeightRecord, MealRecord, FastingRecord, FastingPlan, Goal, UserProfile, AppSettings, CheckInRecord } from '../types';
import { initialFoods } from '../data/foods';
import { getTodayDateString } from '../utils/date';

let dbInitialized = false;

const memoryDB = {
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

export const initDB = async (): Promise<void> => {
  if (dbInitialized) return;
  dbInitialized = true;

  memoryDB.foods = initialFoods.map((f, i) => ({
    ...f,
    id: `food_${i + 1}`,
    isCustom: false,
    isFavorite: false,
  }));

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

  memoryDB.goals = {
    initialWeight: 70,
    currentWeight: 70,
    targetWeight: 65,
    weeklyGoal: 0.5,
    targetDate: '',
    dailyCalorieTarget: 1500,
  };

  memoryDB.fastingPlan = {
    mode: '16:8',
    fastingHours: 16,
    eatingHours: 8,
    eatingStartTime: '12:00',
    isActive: true,
  };

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
};

export const getAllFoods = async (): Promise<Food[]> => {
  return [...memoryDB.foods];
};

export const searchFoods = async (keyword: string): Promise<Food[]> => {
  const lowerKeyword = keyword.toLowerCase();
  return memoryDB.foods
    .filter(f => f.name.toLowerCase().includes(lowerKeyword))
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
  if (food) food.isFavorite = isFavorite;
};

export const addWeightRecord = async (weight: number, date: string, note: string = ''): Promise<void> => {
  const existing = memoryDB.weightRecords.findIndex(r => r.date === date);
  if (existing !== -1) {
    memoryDB.weightRecords.splice(existing, 1);
  }
  memoryDB.weightRecords.push({
    id: `weight_${Date.now()}`,
    weight,
    date,
    note,
    createdAt: Date.now(),
  });
  memoryDB.weightRecords.sort((a, b) => b.date.localeCompare(a.date));
  if (memoryDB.goals) memoryDB.goals.currentWeight = weight;
  await updateCheckInRecord(date, { hasWeightRecord: true });
};

export const getWeightRecords = async (): Promise<WeightRecord[]> => {
  return [...memoryDB.weightRecords].sort((a, b) => b.date.localeCompare(a.date));
};

export const getLatestWeight = async (): Promise<number | null> => {
  return memoryDB.weightRecords.length > 0 ? memoryDB.weightRecords[0].weight : null;
};

export const deleteWeightRecord = async (id: string): Promise<void> => {
  memoryDB.weightRecords = memoryDB.weightRecords.filter(r => r.id !== id);
};

export const addMealRecord = async (
  foodId: string,
  foodName: string,
  mealType: string,
  quantity: number,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  date: string
): Promise<void> => {
  memoryDB.mealRecords.push({
    id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    foodId,
    foodName,
    mealType: mealType as any,
    quantity,
    calories,
    protein,
    carbs,
    fat,
    date,
    createdAt: Date.now(),
  });
  await updateCheckInRecord(date, { hasMealRecord: true });
};

export const getMealRecordsByDate = async (date: string): Promise<MealRecord[]> => {
  return memoryDB.mealRecords.filter(r => r.date === date).sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteMealRecord = async (id: string): Promise<void> => {
  memoryDB.mealRecords = memoryDB.mealRecords.filter(r => r.id !== id);
};

export const getDailyNutrition = async (date: string) => {
  const records = memoryDB.mealRecords.filter(r => r.date === date);
  return records.reduce(
    (acc, r) => ({
      calories: acc.calories + r.calories,
      protein: acc.protein + r.protein,
      carbs: acc.carbs + r.carbs,
      fat: acc.fat + r.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

export const addFastingRecord = async (startTime: number): Promise<string> => {
  const id = `fasting_${Date.now()}`;
  memoryDB.fastingRecords.push({
    id,
    startTime,
    endTime: null,
    status: 'active',
    duration: 0,
  });
  return id;
};

export const endFastingRecord = async (id: string, endTime: number): Promise<void> => {
  const record = memoryDB.fastingRecords.find(r => r.id === id);
  if (record) {
    record.endTime = endTime;
    record.status = 'completed';
    record.duration = Math.floor((endTime - record.startTime) / 60000);
    await updateCheckInRecord(getTodayDateString(), { fastingCompleted: true });
  }
};

export const getActiveFastingRecord = async (): Promise<FastingRecord | null> => {
  return memoryDB.fastingRecords.find(r => r.status === 'active') || null;
};

export const getFastingRecords = async (limit: number = 7): Promise<FastingRecord[]> => {
  return memoryDB.fastingRecords
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, limit);
};

export const getFastingPlan = async (): Promise<FastingPlan | null> => {
  return memoryDB.fastingPlan;
};

export const updateFastingPlan = async (plan: Partial<FastingPlan>): Promise<void> => {
  if (memoryDB.fastingPlan) {
    Object.assign(memoryDB.fastingPlan, plan);
  }
};

export const getGoals = async (): Promise<Goal | null> => {
  return memoryDB.goals;
};

export const updateGoals = async (goals: Partial<Goal>): Promise<void> => {
  if (memoryDB.goals) {
    Object.assign(memoryDB.goals, goals);
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  return memoryDB.userProfile;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (memoryDB.userProfile) {
    Object.assign(memoryDB.userProfile, profile, { updatedAt: Date.now() });
  }
};

export const getAppSettings = async (): Promise<AppSettings | null> => {
  return memoryDB.settings;
};

export const updateAppSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  if (memoryDB.settings) {
    Object.assign(memoryDB.settings, settings);
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
