import { describe, expect, it } from 'vitest';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { DEMO_PERSONAS, personaById } from '../data/demoPersonas';
import { buildConstraints } from './constraints';
import { evaluateExercise, filterAllowed, validateWorkout } from './safetyEngine';
import { applyRegeneration, generateWorkout, replaceExercise } from './workoutGenerator';

const UNSAFE_NAME_FRAGMENTS = ['squat', 'lunge', 'burpee', 'jumping jack'];

function workoutForPersona(id: string) {
  const persona = personaById(id)!;
  return { persona, workout: generateWorkout(persona.profile) };
}

describe('safety engine — workout adaptation', () => {
  it('every demo persona produces a fully validated routine', () => {
    for (const persona of DEMO_PERSONAS) {
      const workout = generateWorkout(persona.profile);
      const constraints = buildConstraints(persona.profile);
      expect(workout.exercises.length).toBeGreaterThanOrEqual(5);
      expect(validateWorkout(workout.exercises, constraints).valid).toBe(true);
    }
  });

  it('wheelchair / seated-only user receives no standing or floor exercises', () => {
    const { workout } = workoutForPersona('wheelchair-upper-body');
    for (const ex of workout.exercises) {
      expect(ex.posture).toBe('seated');
      expect(ex.tags).not.toContain('standing');
      expect(ex.tags).not.toContain('standing-supported');
      expect(ex.tags).not.toContain('floor');
      expect(ex.tags).not.toContain('jumping');
    }
    expect(workout.exercises.length).toBe(8);
  });

  it('one-arm user receives no two-arm-required exercises (no push-ups, planks, wall push)', () => {
    const { workout } = workoutForPersona('one-arm-beginner');
    const ids = workout.exercises.map((e) => e.id);
    expect(ids).not.toContain('standard-pushup');
    expect(ids).not.toContain('floor-plank');
    expect(ids).not.toContain('wall-push');
    for (const ex of workout.exercises) {
      expect(ex.tags).not.toContain('two-arm-required');
      expect(ex.contraindicationTags).not.toContain('requires-two-arms');
    }
  });

  it('knee-pain user receives no jumping, lunges, deep squats or knee-loading moves', () => {
    const { workout } = workoutForPersona('knee-friendly-low-impact');
    for (const ex of workout.exercises) {
      expect(ex.tags).not.toContain('jumping');
      expect(ex.tags).not.toContain('lunge');
      expect(ex.tags).not.toContain('deep-knee-bend');
      expect(ex.tags).not.toContain('high-impact');
      expect(ex.contraindicationTags).not.toContain('knee-stress');
      for (const fragment of UNSAFE_NAME_FRAGMENTS) {
        expect(ex.name.toLowerCase()).not.toContain(fragment);
      }
    }
  });

  it('low-balance user receives no unsupported single-leg or fast-direction movements', () => {
    const { workout } = workoutForPersona('wheelchair-upper-body'); // balance: low
    for (const ex of workout.exercises) {
      expect(ex.tags).not.toContain('unsupported-balance');
      expect(ex.tags).not.toContain('single-leg');
      expect(ex.tags).not.toContain('fast-direction-change');
    }
  });

  it('no-floor constraint removes every floor exercise from the candidate pool', () => {
    const persona = personaById('knee-friendly-low-impact')!;
    const constraints = buildConstraints(persona.profile);
    const allowed = filterAllowed(EXERCISE_LIBRARY, constraints);
    expect(allowed.some((e) => e.tags.includes('floor'))).toBe(false);
  });
});

describe('safety engine — replacement', () => {
  it('replacement respects constraints, does not duplicate and never repeats a rejected option', () => {
    const persona = personaById('wheelchair-upper-body')!;
    const constraints = buildConstraints(persona.profile);
    let workout = generateWorkout(persona.profile);
    const originalId = workout.exercises[0].id;

    const outcome = replaceExercise(workout, 0, 'too-hard', persona.profile);
    expect(outcome.replaced).toBe(true);
    workout = outcome.workout;

    const replacement = workout.exercises[0];
    expect(replacement.id).not.toBe(originalId);
    expect(replacement.rejectedIds).toContain(originalId);
    // Still seated + still valid.
    expect(replacement.posture).toBe('seated');
    expect(validateWorkout(workout.exercises, constraints).valid).toBe(true);
    // No duplicates across the routine.
    const ids = workout.exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a seated replacement request never returns a standing exercise', () => {
    const persona = personaById('knee-friendly-low-impact')!;
    let workout = generateWorkout(persona.profile);
    const standingIndex = workout.exercises.findIndex((e) => e.posture !== 'seated');
    const index = standingIndex >= 0 ? standingIndex : 0;
    const outcome = replaceExercise(workout, index, 'want-seated', persona.profile);
    workout = outcome.workout;
    if (outcome.replaced) {
      expect(workout.exercises[index].posture).toBe('seated');
    }
  });
});

describe('safety engine — regeneration', () => {
  it('"seated" regeneration yields a seated-only routine', () => {
    const persona = personaById('knee-friendly-low-impact')!;
    const reshaped = applyRegeneration(persona.profile, 'seated');
    const workout = generateWorkout(reshaped);
    for (const ex of workout.exercises) {
      expect(ex.posture).toBe('seated');
    }
  });

  it('"shorter" regeneration reduces the exercise count', () => {
    const persona = personaById('wheelchair-upper-body')!;
    const reshaped = applyRegeneration(persona.profile, 'shorter');
    expect(reshaped.preferences.exerciseCount).toBeLessThan(persona.profile.preferences.exerciseCount);
  });
});

describe('safety engine — single exercise evaluation', () => {
  it('blocks a floor plank for a no-floor user with a clear reason', () => {
    const persona = personaById('wheelchair-upper-body')!;
    const constraints = buildConstraints(persona.profile);
    const plank = EXERCISE_LIBRARY.find((e) => e.id === 'floor-plank')!;
    const result = evaluateExercise(plank, constraints);
    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('allows a seated band row for a wheelchair user with a band', () => {
    const persona = personaById('wheelchair-upper-body')!;
    const constraints = buildConstraints(persona.profile);
    const row = EXERCISE_LIBRARY.find((e) => e.id === 'seated-band-row')!;
    expect(evaluateExercise(row, constraints).allowed).toBe(true);
  });

  it('blocks band exercises when no band is available', () => {
    const persona = personaById('wheelchair-upper-body')!;
    const noBand = { ...persona.profile, equipment: ['chair'] };
    const constraints = buildConstraints(noBand);
    const row = EXERCISE_LIBRARY.find((e) => e.id === 'seated-band-row')!;
    expect(evaluateExercise(row, constraints).allowed).toBe(false);
  });
});
