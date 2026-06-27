export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  height: number;
  age: number;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  initialWeight: number;
  currentWeight: number;
  targetWeight: number;
  weeklyGoal: number;
  targetDate: string;
  dailyCalorieTarget: number;
}

export type FastingMode = '16:8' | '18:6' | '20:4' | 'OMAD' | 'custom';

export interface FastingPlan {
  mode: FastingMode;
  fastingHours: number;
  eatingHours: number;
  eatingStartTime: string;
  isActive: boolean;
}

export type FastingStatus = 'active' | 'completed' | 'cancelled';

export interface FastingRecord {
  id: string;
  startTime: number;
  endTime: number | null;
  status: FastingStatus;
  duration: number;
}

export interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  note: string;
  createdAt: number;
}

export type FoodCategory = 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: number;
  image: string;
  isCustom: boolean;
  isFavorite: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealRecord {
  id: string;
  foodId: string;
  foodName: string;
  mealType: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  createdAt: number;
}

export interface CheckInRecord {
  date: string;
  hasWeightRecord: boolean;
  hasMealRecord: boolean;
  fastingCompleted: boolean;
  streak: number;
}

export type ThemeType = 'light' | 'dark' | 'system';

export type WeightUnit = 'kg' | 'jin';
export type HeightUnit = 'cm' | 'ft';
export type CalorieUnit = 'kcal' | 'kJ';

export interface AppSettings {
  theme: ThemeType;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  calorieUnit: CalorieUnit;
  reminderEnabled: boolean;
  fastingReminder: boolean;
  weightReminder: boolean;
  language: string;
}

export interface Recipe {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  name: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  calories: number;
  image: string;
}

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// F201 喝水记录
export interface WaterRecord {
  id: string;
  date: string;
  amount: number;
  createdAt: number;
}

// F202 运动记录
export interface ExerciseRecord {
  id: string;
  date: string;
  name: string;
  type: ExerciseType;
  duration: number;
  calories: number;
  createdAt: number;
}

export type ExerciseType = 'walking' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'other';

// F205 成就系统
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  type: 'streak' | 'weight' | 'fasting' | 'meal' | 'water';
  target: number;
  progress: number;
}

// F203 生理期记录
export interface PeriodRecord {
  id: string;
  date: string;
  type: 'start' | 'end';
  note?: string;
  createdAt: number;
}

export interface PeriodCycle {
  startDate: string;
  endDate: string | null;
  duration: number | null;
}
