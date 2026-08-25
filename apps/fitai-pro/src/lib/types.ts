export const APP_SCHEMA_VERSION = 3 as const;

export type Goal = 'strength' | 'hypertrophy' | 'fat-loss' | 'general';
export type Sex = 'female' | 'male' | 'unspecified';
export type UnitSystem = 'metric' | 'imperial';
export type ExerciseCategory = 'strength' | 'cardio' | 'mobility';
export type SetKind = 'warmup' | 'working' | 'drop' | 'amrap';

export interface UserProfile {
  id: string;
  displayName: string;
  goal: Goal;
  unitSystem: UnitSystem;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string[];
}

export interface WorkoutExercisePlan {
  exerciseId: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  targetRir: number;
  restSeconds: number;
  supersetGroup?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  days: number[];
  exercises: WorkoutExercisePlan[];
  createdAt: string;
  updatedAt: string;
}

export interface SetRecord {
  id: string;
  exerciseId: string;
  kind: SetKind;
  reps: number;
  loadKg: number;
  rir: number;
  durationSeconds?: number;
  distanceMeters?: number;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  sets: SetRecord[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: 'estimated-1rm' | 'load' | 'reps' | 'volume';
  value: number;
  achievedAt: string;
  sessionId: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: Ingredient[];
  notes?: string;
  createdAt: string;
}

export interface MealEntry {
  id: string;
  name: string;
  eatenAt: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  barcode?: string;
  source?: 'manual' | 'recipe' | 'open-food-facts';
}

export interface ClientMeasurement {
  id: string;
  capturedAt: string;
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPercent?: number;
  note?: string;
}

export interface CoachNote {
  id: string;
  createdAt: string;
  text: string;
}

export interface CoachClient {
  id: string;
  name: string;
  goal: Goal;
  email?: string;
  phone?: string;
  active: boolean;
  measurements: ClientMeasurement[];
  notes: CoachNote[];
  createdAt: string;
}

export interface StepSnapshot {
  date: string;
  steps: number;
  updatedAt: string;
}

export interface AppSettings {
  reducedMotion: boolean;
  notificationsEnabled: boolean;
  weeklyWorkoutTarget: number;
  dailyStepTarget: number;
  autoLockMinutes: number;
}

export interface AppState {
  schemaVersion: typeof APP_SCHEMA_VERSION;
  profile: UserProfile;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession?: WorkoutSession;
  personalRecords: PersonalRecord[];
  recipes: Recipe[];
  meals: MealEntry[];
  clients: CoachClient[];
  steps: StepSnapshot[];
  settings: AppSettings;
  updatedAt: string;
}

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSize?: string;
  nutrition: NutritionTotals;
}

export interface VaultEnvelope {
  version: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  cipherText: string;
  savedAt: string;
}
