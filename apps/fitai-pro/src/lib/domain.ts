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
  if (!Number.isFinite(loadKg) || !Number.isFinite(reps) || loadKg <= 0 || reps <= 0) return 0;
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
  const strength = exercises.filter((e) => e.category === 'strength');
  const push = strength.filter((e) => e.primaryMuscles.some((m) => ['chest', 'shoulders', 'triceps'].includes(m)));
  const pull = strength.filter((e) => e.primaryMuscles.some((m) => ['back', 'biceps'].includes(m)));
  const legs = strength.filter((e) => e.primaryMuscles.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m)));
  const pools = [push, pull, legs, strength].map((p) => (p.length ? p : strength));
  const repRange = goal === 'strength' ? [3, 6] : goal === 'hypertrophy' ? [6, 12] : [8, 15];
  const targetRir = goal === 'strength' ? 2 : 2;
  const targetSets = goal === 'strength' ? 4 : 3;
  const names = days <= 3 ? ['Full Body A', 'Full Body B', 'Full Body C'] : ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];

  return Array.from({ length: days }, (_, index) => {
    const pool = days <= 3 ? strength : pools[index % pools.length];
    const chosen = rotate(pool, index).slice(0, Math.min(6, pool.length));
    return {
      id: id('template'),
      name: names[index] ?? `Entreno ${index + 1}`,
      days: [index],
      exercises: chosen.map((exercise) => ({
        exerciseId: exercise.id,
        targetSets,
        minReps: repRange[0],
        maxReps: repRange[1],
        targetRir,
        restSeconds: goal === 'strength' ? 180 : 120,
      })),
      createdAt: nowIso(),
      updatedAt: nowIso(),
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
