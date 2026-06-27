import * as SQLite from 'expo-sqlite';
import { Food, WeightRecord, MealRecord, FastingRecord, FastingPlan, Goal, UserProfile, AppSettings, CheckInRecord } from '../types';
import { initialFoods } from '../data/foods';
import { getTodayDateString } from '../utils/date';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('qingshou.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      fiber REAL NOT NULL,
      servingSize REAL NOT NULL,
      image TEXT,
      isCustom INTEGER NOT NULL DEFAULT 0,
      isFavorite INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS weight_records (
      id TEXT PRIMARY KEY,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_records (
      id TEXT PRIMARY KEY,
      foodId TEXT NOT NULL,
      foodName TEXT NOT NULL,
      mealType TEXT NOT NULL,
      quantity REAL NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      date TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fasting_records (
      id TEXT PRIMARY KEY,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      status TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      avatar TEXT,
      gender TEXT,
      height REAL,
      age INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY DEFAULT 1,
      initialWeight REAL,
      currentWeight REAL,
      targetWeight REAL,
      weeklyGoal REAL,
      targetDate TEXT,
      dailyCalorieTarget REAL
    );

    CREATE TABLE IF NOT EXISTS fasting_plan (
      id INTEGER PRIMARY KEY DEFAULT 1,
      mode TEXT NOT NULL,
      fastingHours REAL NOT NULL,
      eatingHours REAL NOT NULL,
      eatingStartTime TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'system',
      weightUnit TEXT NOT NULL DEFAULT 'kg',
      heightUnit TEXT NOT NULL DEFAULT 'cm',
      calorieUnit TEXT NOT NULL DEFAULT 'kcal',
      reminderEnabled INTEGER NOT NULL DEFAULT 1,
      fastingReminder INTEGER NOT NULL DEFAULT 1,
      weightReminder INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'zh-CN'
    );

    CREATE TABLE IF NOT EXISTS check_in_records (
      date TEXT PRIMARY KEY,
      hasWeightRecord INTEGER NOT NULL DEFAULT 0,
      hasMealRecord INTEGER NOT NULL DEFAULT 0,
      fastingCompleted INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0
    );
  `);

  await seedFoods();
  await seedDefaultData();
};

const seedFoods = async (): Promise<void> => {
  if (!db) return;
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM foods');
  if (result && result.count > 0) return;

  const insertStmt = await db.prepareAsync(
    'INSERT INTO foods (id, name, category, calories, protein, carbs, fat, fiber, servingSize, image, isCustom, isFavorite) VALUES ($id, $name, $category, $calories, $protein, $carbs, $fat, $fiber, $servingSize, $image, $isCustom, $isFavorite)'
  );

  try {
    for (let i = 0; i < initialFoods.length; i++) {
      const food = initialFoods[i];
      await insertStmt.executeAsync({
        $id: `food_${i + 1}`,
        $name: food.name,
        $category: food.category,
        $calories: food.calories,
        $protein: food.protein,
        $carbs: food.carbs,
        $fat: food.fat,
        $fiber: food.fiber,
        $servingSize: food.servingSize,
        $image: food.image,
        $isCustom: 0,
        $isFavorite: 0,
      });
    }
  } finally {
    await insertStmt.finalizeAsync();
  }
};

const seedDefaultData = async (): Promise<void> => {
  if (!db) return;

  const settings = await db.getFirstAsync('SELECT * FROM app_settings WHERE id = 1');
  if (!settings) {
    await db.runAsync(
      `INSERT INTO app_settings (theme, weightUnit, heightUnit, calorieUnit, reminderEnabled, fastingReminder, weightReminder, language)
       VALUES ('system', 'kg', 'cm', 'kcal', 1, 1, 0, 'zh-CN')`
    );
  }

  const plan = await db.getFirstAsync('SELECT * FROM fasting_plan WHERE id = 1');
  if (!plan) {
    await db.runAsync(
      `INSERT INTO fasting_plan (mode, fastingHours, eatingHours, eatingStartTime, isActive)
       VALUES ('16:8', 16, 8, '12:00', 1)`
    );
  }

  const goals = await db.getFirstAsync('SELECT * FROM goals WHERE id = 1');
  if (!goals) {
    await db.runAsync(
      `INSERT INTO goals (initialWeight, currentWeight, targetWeight, weeklyGoal, targetDate, dailyCalorieTarget)
       VALUES (70, 70, 65, 0.5, '', 1500)`
    );
  }

  const profile = await db.getFirstAsync('SELECT * FROM user_profile');
  if (!profile) {
    await db.runAsync(
      `INSERT INTO user_profile (id, nickname, avatar, gender, height, age, createdAt, updatedAt)
       VALUES (?, '', '', 'unknown', 170, 25, ?, ?)`,
      ['user_default', Date.now(), Date.now()]
    );
  }
};

export const getAllFoods = async (): Promise<Food[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>('SELECT * FROM foods ORDER BY name');
  return rows.map(row => ({ ...row, isCustom: !!row.isCustom, isFavorite: !!row.isFavorite }));
};

export const searchFoods = async (keyword: string): Promise<Food[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM foods WHERE name LIKE ? ORDER BY isFavorite DESC, name',
    [`%${keyword}%`]
  );
  return rows.map(row => ({ ...row, isCustom: !!row.isCustom, isFavorite: !!row.isFavorite }));
};

export const getFoodsByCategory = async (category: string): Promise<Food[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM foods WHERE category = ? ORDER BY isFavorite DESC, name',
    [category]
  );
  return rows.map(row => ({ ...row, isCustom: !!row.isCustom, isFavorite: !!row.isFavorite }));
};

export const getFavoriteFoods = async (): Promise<Food[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>('SELECT * FROM foods WHERE isFavorite = 1 ORDER BY name');
  return rows.map(row => ({ ...row, isCustom: !!row.isCustom, isFavorite: !!row.isFavorite }));
};

export const toggleFavoriteFood = async (foodId: string, isFavorite: boolean): Promise<void> => {
  if (!db) return;
  await db.runAsync('UPDATE foods SET isFavorite = ? WHERE id = ?', [isFavorite ? 1 : 0, foodId]);
};

export const addWeightRecord = async (weight: number, date: string, note: string = ''): Promise<void> => {
  if (!db) return;
  const id = `weight_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO weight_records (id, weight, date, note, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, weight, date, note, Date.now()]
  );
  const existing = await db.getFirstAsync<any>('SELECT * FROM weight_records WHERE date = ? AND id != ?', [date, id]);
  if (existing) {
    await db.runAsync('DELETE FROM weight_records WHERE id = ?', [existing.id]);
  }
  await db.runAsync('UPDATE goals SET currentWeight = ? WHERE id = 1', [weight]);
  await updateCheckInRecord(date, { hasWeightRecord: true });
};

export const getWeightRecords = async (): Promise<WeightRecord[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>('SELECT * FROM weight_records ORDER BY date DESC');
  return rows as WeightRecord[];
};

export const getLatestWeight = async (): Promise<number | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT weight FROM weight_records ORDER BY date DESC LIMIT 1');
  return row ? row.weight : null;
};

export const deleteWeightRecord = async (id: string): Promise<void> => {
  if (!db) return;
  await db.runAsync('DELETE FROM weight_records WHERE id = ?', [id]);
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
  if (!db) return;
  const id = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.runAsync(
    `INSERT INTO meal_records (id, foodId, foodName, mealType, quantity, calories, protein, carbs, fat, date, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, foodId, foodName, mealType, quantity, calories, protein, carbs, fat, date, Date.now()]
  );
  await updateCheckInRecord(date, { hasMealRecord: true });
};

export const getMealRecordsByDate = async (date: string): Promise<MealRecord[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM meal_records WHERE date = ? ORDER BY createdAt DESC',
    [date]
  );
  return rows as MealRecord[];
};

export const deleteMealRecord = async (id: string): Promise<void> => {
  if (!db) return;
  await db.runAsync('DELETE FROM meal_records WHERE id = ?', [id]);
};

export const getDailyNutrition = async (date: string) => {
  if (!db) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const row = await db.getFirstAsync<any>(
    `SELECT 
      COALESCE(SUM(calories), 0) as calories,
      COALESCE(SUM(protein), 0) as protein,
      COALESCE(SUM(carbs), 0) as carbs,
      COALESCE(SUM(fat), 0) as fat
     FROM meal_records WHERE date = ?`,
    [date]
  );
  return row || { calories: 0, protein: 0, carbs: 0, fat: 0 };
};

export const addFastingRecord = async (startTime: number): Promise<string> => {
  if (!db) return '';
  const id = `fasting_${Date.now()}`;
  await db.runAsync(
    `INSERT INTO fasting_records (id, startTime, endTime, status, duration)
     VALUES (?, ?, NULL, 'active', 0)`,
    [id, startTime]
  );
  return id;
};

export const endFastingRecord = async (id: string, endTime: number): Promise<void> => {
  if (!db) return;
  const record = await db.getFirstAsync<any>('SELECT startTime FROM fasting_records WHERE id = ?', [id]);
  if (!record) return;
  const duration = Math.floor((endTime - record.startTime) / 60000);
  await db.runAsync(
    `UPDATE fasting_records SET endTime = ?, status = 'completed', duration = ? WHERE id = ?`,
    [endTime, duration, id]
  );
  const today = getTodayDateString();
  await updateCheckInRecord(today, { fastingCompleted: true });
};

export const getActiveFastingRecord = async (): Promise<FastingRecord | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>("SELECT * FROM fasting_records WHERE status = 'active' ORDER BY startTime DESC LIMIT 1");
  return row as FastingRecord | null;
};

export const getFastingRecords = async (limit: number = 7): Promise<FastingRecord[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM fasting_records ORDER BY startTime DESC LIMIT ?',
    [limit]
  );
  return rows as FastingRecord[];
};

export const getFastingPlan = async (): Promise<FastingPlan | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM fasting_plan WHERE id = 1');
  if (!row) return null;
  return { ...row, isActive: !!row.isActive } as FastingPlan;
};

export const updateFastingPlan = async (plan: Partial<FastingPlan>): Promise<void> => {
  if (!db) return;
  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    mode: 'mode',
    fastingHours: 'fastingHours',
    eatingHours: 'eatingHours',
    eatingStartTime: 'eatingStartTime',
    isActive: 'isActive',
  };
  for (const [key, value] of Object.entries(plan)) {
    const dbField = fieldMap[key];
    if (dbField) {
      fields.push(`${dbField} = ?`);
      values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
    }
  }
  if (fields.length === 0) return;
  values.push(1);
  await db.runAsync(`UPDATE fasting_plan SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const getGoals = async (): Promise<Goal | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM goals WHERE id = 1');
  return row as Goal | null;
};

export const updateGoals = async (goals: Partial<Goal>): Promise<void> => {
  if (!db) return;
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, value] of Object.entries(goals)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  values.push(1);
  await db.runAsync(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM user_profile LIMIT 1');
  return row as UserProfile | null;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (!db) return;
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, value] of Object.entries(profile)) {
    if (key === 'id') continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  fields.push('updatedAt = ?');
  values.push(Date.now());
  if (fields.length === 0) return;
  values.push('user_default');
  await db.runAsync(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const getAppSettings = async (): Promise<AppSettings | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM app_settings WHERE id = 1');
  if (!row) return null;
  return {
    ...row,
    reminderEnabled: !!row.reminderEnabled,
    fastingReminder: !!row.fastingReminder,
    weightReminder: !!row.weightReminder,
  } as AppSettings;
};

export const updateAppSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  if (!db) return;
  const fields: string[] = [];
  const values: any[] = [];
  const boolFields = ['reminderEnabled', 'fastingReminder', 'weightReminder'];
  for (const [key, value] of Object.entries(settings)) {
    fields.push(`${key} = ?`);
    if (boolFields.includes(key)) {
      values.push(value ? 1 : 0);
    } else {
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(1);
  await db.runAsync(`UPDATE app_settings SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const getCheckInRecord = async (date: string): Promise<CheckInRecord | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<any>('SELECT * FROM check_in_records WHERE date = ?', [date]);
  if (!row) return null;
  return {
    ...row,
    hasWeightRecord: !!row.hasWeightRecord,
    hasMealRecord: !!row.hasMealRecord,
    fastingCompleted: !!row.fastingCompleted,
  } as CheckInRecord;
};

export const updateCheckInRecord = async (date: string, updates: Partial<CheckInRecord>): Promise<void> => {
  if (!db) return;
  const existing = await getCheckInRecord(date);
  const boolFields = ['hasWeightRecord', 'hasMealRecord', 'fastingCompleted'];
  if (!existing) {
    const fields = ['date'];
    const values: any[] = [date];
    const placeholders = ['?'];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(key);
      placeholders.push('?');
      if (boolFields.includes(key)) {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
    await db.runAsync(
      `INSERT INTO check_in_records (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
    );
  } else {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      if (boolFields.includes(key)) {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
    values.push(date);
    await db.runAsync(`UPDATE check_in_records SET ${fields.join(', ')} WHERE date = ?`, values);
  }
};

export const getCheckInRecords = async (): Promise<CheckInRecord[]> => {
  if (!db) return [];
  const rows = await db.getAllAsync<any>('SELECT * FROM check_in_records ORDER BY date DESC');
  return rows.map(row => ({
    ...row,
    hasWeightRecord: !!row.hasWeightRecord,
    hasMealRecord: !!row.hasMealRecord,
    fastingCompleted: !!row.fastingCompleted,
  })) as CheckInRecord[];
};

export const getStreak = async (): Promise<number> => {
  if (!db) return 0;
  const today = getTodayDateString();
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const record = await getCheckInRecord(dateStr);
    if (record && (record.hasWeightRecord || record.hasMealRecord || record.fastingCompleted)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
    if (streak > 365) break;
  }
  return streak;
};
