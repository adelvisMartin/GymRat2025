import { describe, expect, it } from 'vitest';
import { EXERCISE_CATALOG } from '../src/lib/catalog';
import { buildRoutine, detectPersonalRecords, estimatedOneRepMax, nextLoadKg, nutritionTotals, platePlan, sessionVolume } from '../src/lib/domain';
import type { WorkoutSession } from '../src/lib/types';

describe('training engine', () => {
  it('estimates one rep max with Epley only in the supported 1-12 rep range', () => {
    expect(estimatedOneRepMax(100, 5)).toBe(116.7);
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(100, 12)).toBe(140);
    expect(estimatedOneRepMax(100, 13)).toBe(0);
    expect(estimatedOneRepMax(100, 25)).toBe(0);
  });

  it('progresses load only when reps and RIR support it', () => {
    expect(nextLoadKg({ lastLoadKg: 80, achievedReps: 12, minReps: 8, maxReps: 12, actualRir: 2, targetRir: 2 })).toBe(82.5);
    expect(nextLoadKg({ lastLoadKg: 80, achievedReps: 6, minReps: 8, maxReps: 12, actualRir: 0, targetRir: 2 })).toBe(77.5);
    expect(nextLoadKg({ lastLoadKg: 80, achievedReps: 10, minReps: 8, maxReps: 12, actualRir: 2, targetRir: 2 })).toBe(80);
  });

  it('calculates per-side plates after subtracting the bar', () => {
    expect(platePlan(100, 20, [20, 10, 5, 2.5])).toEqual([20, 20]);
  });

  it('keeps a 5-day Lower routine restricted to lower-body exercises', () => {
    const routine = buildRoutine('hypertrophy', 5, EXERCISE_CATALOG);
    expect(routine.map((day) => day.name)).toEqual(['Push', 'Pull', 'Legs', 'Upper', 'Lower']);

    const lower = routine[4];
    expect(lower.exercises.length).toBeGreaterThan(0);
    for (const plan of lower.exercises) {
      const exercise = EXERCISE_CATALOG.find((candidate) => candidate.id === plan.exerciseId);
      expect(exercise).toBeDefined();
      expect(exercise?.primaryMuscles.some((muscle) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(muscle))).toBe(true);
    }
  });

  it('uses explicit upper/lower semantics for a 4-day program', () => {
    const routine = buildRoutine('strength', 4, EXERCISE_CATALOG);
    expect(routine.map((day) => day.name)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B']);
  });

  it('detects new personal records after a finished session', () => {
    const session: WorkoutSession = {
      id: 's1',
      name: 'Push',
      startedAt: '2026-08-24T10:00:00Z',
      finishedAt: '2026-08-24T11:00:00Z',
      sets: [
        { id: 'a', exerciseId: 'bench-press', kind: 'working', reps: 8, loadKg: 80, rir: 2, completedAt: '2026-08-24T10:20:00Z' },
        { id: 'b', exerciseId: 'bench-press', kind: 'working', reps: 6, loadKg: 85, rir: 1, completedAt: '2026-08-24T10:25:00Z' },
      ],
    };
    expect(sessionVolume(session)).toBe(1150);
    const records = detectPersonalRecords(session, []);
    expect(records.map((record) => record.type).sort()).toEqual(['estimated-1rm', 'load', 'reps', 'volume'].sort());
  });
});

describe('nutrition engine', () => {
  it('sums macro totals safely', () => {
    expect(nutritionTotals([
      { calories: 400, proteinG: 30, carbsG: 45, fatG: 10 },
      { calories: 250, proteinG: 20, carbsG: 20, fatG: 8 },
    ])).toEqual({ calories: 650, proteinG: 50, carbsG: 65, fatG: 18 });
  });
});
