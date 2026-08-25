import {
  APP_SCHEMA_VERSION,
  type AppState,
  type Exercise,
  type Goal,
  type NutritionTotals,
  type PersonalRecord,
  type SetRecord,
  type WorkoutSession,
  type WorkoutTemplate,
} from './types';

const nowIso = () => new Date().toISOString();

export function id(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function estimatedOneRepMax(loadKg: number, reps: number): number {
  if (!Number.isFinite(loadKg) || !Number.isFinite(reps) || loadKg <= 0 || reps <= 0 || reps > 12) return 0;
  if (reps === 1) return round(loadKg, 1);
  return round(loadKg * (1 + reps / 30), 1);
}

export function setVolume(set: Pick<SetRecord, 'loadKg' | 'reps'>): number {
  return Math.max(0, set.loadKg) * Math.max(0, set.reps);
}

export function sessionVolume(session: WorkoutSession): number {
  return round(session.sets.reduce((sum, set) => sum + setVolume(set), 0), 1);
}

export function nextLoadKg(params: {
  lastLoadKg: number;
  achievedReps: number;
  minReps: number;
  maxReps: number;
  actualRir: number;
  targetRir: number;
  incrementKg?: number;
}): number {
  const increment = params.incrementKg ?? 2.5;
  const load = Math.max(0, params.lastLoadKg);
  if (params.achievedReps >= params.maxReps && params.actualRir >= params.targetRir) {
    return roundToIncrement(load + increment, increment);
  }
  if (params.achievedReps < params.minReps || params.actualRir < Math.max(0, params.targetRir - 1)) {
    return roundToIncrement(Math.max(0, load - increment), increment);
  }
  return roundToIncrement(load, increment);
}

export function platePlan(totalKg: number, barKg = 20, available = [25, 20, 15, 10, 5, 2.5, 1.25]): number[] {
  let perSide = Math.max(0, (totalKg - barKg) / 2);
  const result: number[] = [];
  for (const plate of available) {
    while (perSide + 1e-9 >= plate) {
      result.push(plate);
      perSide = round(perSide - plate, 3);
    }
  }
  return result;
}

export function nutritionTotals(items: Array<Partial<NutritionTotals>>): NutritionTotals {
  return items.reduce<NutritionTotals>(
    (acc, item) => ({
      calories: round(acc.calories + safe(item.calories), 1),
      proteinG: round(acc.proteinG + safe(item.proteinG), 1),
      carbsG: round(acc.carbsG + safe(item.carbsG), 1),
      fatG: round(acc.fatG + safe(item.fatG), 1),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function detectPersonalRecords(session: WorkoutSession, previous: PersonalRecord[]): PersonalRecord[] {
  const created: PersonalRecord[] = [];
  const byExercise = new Map<string, SetRecord[]>();
  for (const set of session.sets) {
    const bucket = byExercise.get(set.exerciseId) ?? [];
    bucket.push(set);
    byExercise.set(set.exerciseId, bucket);
  }

  for (const [exerciseId, sets] of byExercise) {
    const candidates = [
      { type: 'estimated-1rm' as const, value: Math.max(...sets.map((s) => estimatedOneRepMax(s.loadKg, s.reps))) },
      { type: 'load' as const, value: Math.max(...sets.map((s) => s.loadKg)) },
      { type: 'reps' as const, value: Math.max(...sets.map((s) => s.reps)) },
      { type: 'volume' as const, value: Math.max(...sets.map(setVolume)) },
    ];

    for (const candidate of candidates) {
      const best = Math.max(
        0,
        ...previous
          .filter((pr) => pr.exerciseId === exerciseId && pr.type === candidate.type)
          .map((pr) => pr.value),
      );
      if (candidate.value > best && candidate.value > 0) {
        created.push({
          id: id('pr'),
          exerciseId,
          type: candidate.type,
          value: round(candidate.value, 1),
          achievedAt: session.finishedAt ?? nowIso(),
          sessionId: session.id,
        });
      }
    }
  }
  return created;
}

export function buildRoutine(goal: Goal, daysPerWeek: number, exercises: Exercise[]): WorkoutTemplate[] {
  const days = clamp(Math.round(daysPerWeek), 2, 6);
  const strength = exercises.filter((exercise) => exercise.category === 'strength');
  const push = strength.filter((exercise) => exercise.primaryMuscles.some((muscle) => ['chest', 'shoulders', 'triceps'].includes(muscle)));
  const pull = strength.filter((exercise) => exercise.primaryMuscles.some((muscle) => ['back', 'biceps', 'forearms'].includes(muscle)));
  const lower = strength.filter((exercise) => exercise.primaryMuscles.some((muscle) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(muscle)));
  const upper = strength.filter((exercise) => exercise.primaryMuscles.some((muscle) => ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'forearms'].includes(muscle)));

  const safeStrength = strength.length ? strength : exercises;
  const safePush = push.length ? push : safeStrength;
  const safePull = pull.length ? pull : safeStrength;
  const safeLower = lower.length ? lower : safeStrength;
  const safeUpper = upper.length ? upper : safeStrength;

  const plan = splitPlan(days, {
    strength: safeStrength,
    push: safePush,
    pull: safePull,
    lower: safeLower,
    upper: safeUpper,
  });
  const repRange = goal === 'strength' ? [3, 6] : goal === 'hypertrophy' ? [6, 12] : [8, 15];
  const targetRir = 2;
  const targetSets = goal === 'strength' ? 4 : 3;

  return plan.map((dayPlan, index) => {
    const chosen = rotate(dayPlan.pool, dayPlan.rotation).slice(0, Math.min(6, dayPlan.pool.length));
    const timestamp = nowIso();
    return {
      id: id('template'),
      name: dayPlan.name,
      days: [index],
      exercises: chosen.map((exercise) => ({
        exerciseId: exercise.id,
        targetSets,
        minReps: repRange[0],
        maxReps: repRange[1],
        targetRir,
        restSeconds: goal === 'strength' ? 180 : 120,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export function emptyState(displayName: string, goal: Goal, exercises: Exercise[]): AppState {
  const timestamp = nowIso();
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    profile: {
      id: id('user'),
      displayName: displayName.trim() || 'Atleta',
      goal,
      unitSystem: 'metric',
      createdAt: timestamp,
    },
    exercises,
    templates: [],
    sessions: [],
    personalRecords: [],
    recipes: [],
    meals: [],
    clients: [],
    steps: [],
    settings: {
      reducedMotion: false,
      notificationsEnabled: false,
      weeklyWorkoutTarget: 4,
      dailyStepTarget: 8000,
      autoLockMinutes: 10,
    },
    updatedAt: timestamp,
  };
}

export function exerciseName(exercises: Exercise[], exerciseId: string): string {
  return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Ejercicio';
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function workoutsThisWeek(sessions: WorkoutSession[], reference = new Date()): number {
  const start = new Date(reference);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return sessions.filter((session) => session.finishedAt && new Date(session.finishedAt) >= start).length;
}

type RoutinePools = {
  strength: Exercise[];
  push: Exercise[];
  pull: Exercise[];
  lower: Exercise[];
  upper: Exercise[];
};

type RoutineDay = {
  name: string;
  pool: Exercise[];
  rotation: number;
};

function splitPlan(days: number, pools: RoutinePools): RoutineDay[] {
  if (days === 2) {
    return [
      { name: 'Full Body A', pool: pools.strength, rotation: 0 },
      { name: 'Full Body B', pool: pools.strength, rotation: 3 },
    ];
  }
  if (days === 3) {
    return [
      { name: 'Full Body A', pool: pools.strength, rotation: 0 },
      { name: 'Full Body B', pool: pools.strength, rotation: 3 },
      { name: 'Full Body C', pool: pools.strength, rotation: 6 },
    ];
  }
  if (days === 4) {
    return [
      { name: 'Upper A', pool: pools.upper, rotation: 0 },
      { name: 'Lower A', pool: pools.lower, rotation: 0 },
      { name: 'Upper B', pool: pools.upper, rotation: 3 },
      { name: 'Lower B', pool: pools.lower, rotation: 3 },
    ];
  }
  if (days === 5) {
    return [
      { name: 'Push', pool: pools.push, rotation: 0 },
      { name: 'Pull', pool: pools.pull, rotation: 0 },
      { name: 'Legs', pool: pools.lower, rotation: 0 },
      { name: 'Upper', pool: pools.upper, rotation: 2 },
      { name: 'Lower', pool: pools.lower, rotation: 2 },
    ];
  }
  return [
    { name: 'Push A', pool: pools.push, rotation: 0 },
    { name: 'Pull A', pool: pools.pull, rotation: 0 },
    { name: 'Legs A', pool: pools.lower, rotation: 0 },
    { name: 'Push B', pool: pools.push, rotation: 3 },
    { name: 'Pull B', pool: pools.pull, rotation: 3 },
    { name: 'Legs B', pool: pools.lower, rotation: 3 },
  ];
}

function rotate<T>(items: T[], offset: number): T[] {
  if (!items.length) return [];
  const pivot = offset % items.length;
  return [...items.slice(pivot), ...items.slice(0, pivot)];
}

function roundToIncrement(value: number, increment: number): number {
  return round(Math.round(value / increment) * increment, 2);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safe(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
