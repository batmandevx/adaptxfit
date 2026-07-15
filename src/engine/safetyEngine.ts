import type { Constraints, Exercise } from '../types';
import { buildAvoidStress } from './constraints';
import { TAG_LABELS } from '../data/options';

export interface EvaluationResult {
  allowed: boolean;
  reasons: string[];
}

const DIFFICULTY_RANK: Record<Exercise['difficulty'], number> = {
  beginner: 0,
  easy: 1,
  moderate: 2,
};

function equipmentSatisfied(exercise: Exercise, available: string[]): boolean {
  return exercise.equipment.every((item) => available.includes(item));
}

function nameMatchesAvoided(exercise: Exercise, keywords: string[]): string | null {
  const name = exercise.name.toLowerCase();
  for (const keyword of keywords) {
    if (name.includes(keyword.toLowerCase())) return keyword;
  }
  return null;
}

/**
 * The core deterministic safety check. Returns whether an exercise is safe for
 * the given constraints and, if not, human-readable reasons. This is the gate
 * every exercise must pass before it can be shown to the user.
 */
export function evaluateExercise(
  exercise: Exercise,
  constraints: Constraints,
  avoidStress: Set<string> = buildAvoidStress(constraints),
): EvaluationResult {
  const reasons: string[] = [];

  // 1. Tag-based exclusion (primary rule).
  for (const tag of exercise.tags) {
    if (constraints.avoidTags.has(tag)) {
      reasons.push(`Involves ${TAG_LABELS[tag]?.toLowerCase() ?? tag} movement, which you asked to avoid.`);
    }
  }

  // 2. Contraindication / requirement exclusion.
  for (const stress of exercise.contraindicationTags) {
    if (avoidStress.has(stress)) {
      reasons.push(stressReason(stress));
    }
  }

  // 3. Name keyword guard (belt-and-suspenders).
  const matchedName = nameMatchesAvoided(exercise, constraints.avoidNameKeywords);
  if (matchedName) {
    reasons.push(`This movement type (${matchedName}) is on your avoid list.`);
  }

  // 4. Equipment availability.
  if (!equipmentSatisfied(exercise, constraints.availableEquipment)) {
    const missing = exercise.equipment.filter((item) => !constraints.availableEquipment.includes(item));
    reasons.push(`Needs equipment you do not have available: ${missing.join(', ')}.`);
  }

  return { allowed: reasons.length === 0, reasons: dedupe(reasons) };
}

function stressReason(stress: string): string {
  switch (stress) {
    case 'knee-stress':
      return 'Places load on the knees, which you asked to protect.';
    case 'shoulder-stress':
      return 'Loads the shoulders, which you asked to protect.';
    case 'back-stress':
      return 'Adds stress to the back, which you asked to protect.';
    case 'hip-stress':
      return 'Adds load to the hips, which you asked to protect.';
    case 'ankle-stress':
      return 'Adds load to the ankles, which you asked to protect.';
    case 'requires-standing':
      return 'Requires standing, which is not part of your routine right now.';
    case 'requires-floor':
      return 'Requires getting onto the floor, which you asked to avoid.';
    case 'requires-two-arms':
      return 'Requires two loaded arms; a one-arm-friendly option is used instead.';
    case 'requires-balance':
      return 'Requires unsupported balance; a supported option is used instead.';
    default:
      return 'Does not match your support and safety needs.';
  }
}

export function isExerciseAllowed(exercise: Exercise, constraints: Constraints): boolean {
  return evaluateExercise(exercise, constraints).allowed;
}

export function filterAllowed(exercises: Exercise[], constraints: Constraints): Exercise[] {
  const avoidStress = buildAvoidStress(constraints);
  return exercises.filter((exercise) => evaluateExercise(exercise, constraints, avoidStress).allowed);
}

/** Rank how well a (already-safe) exercise fits the user's goals and preferences. */
export function scoreExercise(exercise: Exercise, constraints: Constraints): number {
  let score = 0;
  for (const muscle of exercise.targetMuscles) {
    if (constraints.targetMuscles.includes(muscle)) score += 3;
  }
  for (const tag of exercise.tags) {
    if (constraints.preferTags.has(tag)) score += 2;
  }
  if (DIFFICULTY_RANK[exercise.difficulty] <= DIFFICULTY_RANK[constraints.maxDifficulty]) {
    score += 1;
  } else {
    score -= 2; // a touch too hard for the requested intensity
  }
  if (exercise.tags.includes('low-impact')) score += 1;
  if (exercise.tags.includes('no-floor')) score += 0.5;
  // For users who can stand, gently surface supported-standing variety so the
  // routine isn't needlessly seated-only. Seated-only users never reach here
  // for standing moves because those are filtered out upstream.
  if (
    constraints.standingAllowed &&
    !constraints.seatedOnly &&
    (exercise.tags.includes('standing-supported') || exercise.tags.includes('standing'))
  ) {
    score += 2;
  }
  return score;
}

export interface WorkoutValidation {
  valid: boolean;
  violations: { exerciseId: string; name: string; reasons: string[] }[];
}

/** The final gate: confirm an assembled routine contains only safe exercises. */
export function validateWorkout(exercises: Exercise[], constraints: Constraints): WorkoutValidation {
  const avoidStress = buildAvoidStress(constraints);
  const violations: WorkoutValidation['violations'] = [];
  for (const exercise of exercises) {
    const result = evaluateExercise(exercise, constraints, avoidStress);
    if (!result.allowed) {
      violations.push({ exerciseId: exercise.id, name: exercise.name, reasons: result.reasons });
    }
  }
  return { valid: violations.length === 0, violations };
}

/** A warm, transparent explanation of why an exercise was chosen. */
export function buildSelectionReason(exercise: Exercise, constraints: Constraints): string {
  const matchedMuscles = exercise.targetMuscles.filter((m) => constraints.targetMuscles.includes(m));
  const muscleText = matchedMuscles.length
    ? matchedMuscles.slice(0, 2).join(' and ')
    : exercise.targetMuscles.slice(0, 2).join(' and ');

  const supportTag = exercise.tags.find((t) =>
    ['seated', 'chair-supported', 'wall-supported', 'balance-support', 'standing-supported'].includes(t),
  );
  const supportText = supportTag
    ? ` while you stay ${TAG_LABELS[supportTag]?.toLowerCase() ?? 'supported'}`
    : exercise.tags.includes('low-impact')
      ? ' with a low-impact approach'
      : '';

  return `${exercise.name} was chosen to support ${muscleText}${supportText}. ${exercise.confidenceNote}`;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
