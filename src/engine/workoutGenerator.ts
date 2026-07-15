import type {
  AbilityProfile,
  Constraints,
  Exercise,
  RegenerationMode,
  ReplacementReason,
  Workout,
  WorkoutExercise,
} from '../types';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { buildConstraints } from './constraints';
import { buildSelectionReason, filterAllowed, scoreExercise } from './safetyEngine';

// Ultra-safe seated, no-equipment, no-floor movements used as a last-resort
// fallback so the user is never left with an empty routine.
const FALLBACK_SAFE_IDS = [
  'seated-shoulder-circles',
  'seated-neck-release',
  'seated-ankle-wrist-circles',
  'seated-forward-reach',
  'seated-core-rotation',
  'seated-side-bend',
];

const REGION_ORDER: Record<Exercise['focusRegion'], number> = {
  mobility: 0,
  upper: 1,
  core: 2,
  lower: 3,
  full: 4,
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Greedy, diversity-aware selection across body regions. Deterministic given scores. */
function selectExercises(candidates: Exercise[], count: number, constraints: Constraints): Exercise[] {
  const scored = candidates
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, constraints) }))
    .sort((a, b) => b.score - a.score);

  const byRegion = new Map<string, Exercise[]>();
  for (const { exercise } of scored) {
    const list = byRegion.get(exercise.focusRegion) ?? [];
    list.push(exercise);
    byRegion.set(exercise.focusRegion, list);
  }

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Round-robin across regions for variety.
  let added = true;
  while (selected.length < count && added) {
    added = false;
    for (const region of Object.keys(REGION_ORDER)) {
      const list = byRegion.get(region);
      if (!list || list.length === 0) continue;
      const next = list.shift();
      if (next && !usedIds.has(next.id)) {
        selected.push(next);
        usedIds.add(next.id);
        added = true;
        if (selected.length >= count) break;
      }
    }
  }

  return orderForSession(selected);
}

/** Warm-up (mobility) first; place a gentle cooldown last when possible. */
function orderForSession(exercises: Exercise[]): Exercise[] {
  const ordered = [...exercises].sort((a, b) => REGION_ORDER[a.focusRegion] - REGION_ORDER[b.focusRegion]);
  if (ordered.length > 3) {
    const cooldownIdx = ordered.findIndex(
      (e, i) => i > 0 && (e.tags.includes('gentle-mobility') || e.focusRegion === 'mobility'),
    );
    if (cooldownIdx > 0 && cooldownIdx < ordered.length - 1) {
      const [cooldown] = ordered.splice(cooldownIdx, 1);
      ordered.push(cooldown);
    }
  }
  return ordered;
}

export function computeAdaptations(constraints: Constraints): string[] {
  const labels: string[] = [];
  if (constraints.seatedOnly) labels.push('Seated only');
  if (!constraints.floorAllowed) labels.push('No floor needed');
  if (constraints.oneArmOnly) labels.push('One-arm friendly');
  if (constraints.lowBalance) labels.push('Balance-supported');
  if (constraints.kneeCaution) labels.push('Knee-protective');
  if (constraints.shoulderCaution) labels.push('Shoulder-protective');
  if (constraints.backCaution) labels.push('Back-protective');
  if (constraints.hipCaution) labels.push('Hip-protective');
  if (constraints.preferTags.has('no-equipment')) labels.push('No equipment');
  if (constraints.preferTags.has('low-impact') || constraints.preferTags.has('gentle-mobility')) {
    labels.push('Low impact');
  }
  if (labels.length === 0) labels.push('Personalized');
  return [...new Set(labels)];
}

function estimateMinutes(exercises: Exercise[]): number {
  const seconds = exercises.reduce((sum, e) => sum + e.durationSeconds + e.restSeconds, 0);
  return Math.max(1, Math.round(seconds / 60));
}

function toWorkoutExercise(exercise: Exercise, constraints: Constraints, rejectedIds: string[] = []): WorkoutExercise {
  return {
    ...exercise,
    selectionReason: buildSelectionReason(exercise, constraints),
    status: 'pending',
    rejectedIds,
  };
}

function describeStyle(profile: AbilityProfile, constraints: Constraints): string {
  if (constraints.seatedOnly) return 'Seated adaptive routine';
  if (constraints.kneeCaution) return 'Low-impact, knee-friendly routine';
  if (constraints.oneArmOnly) return 'One-arm friendly routine';
  if (profile.preferences.intensity === 'gentle') return 'Gentle mobility routine';
  if (profile.preferences.intensity === 'moderate') return 'Strength-focused adaptive routine';
  return 'Adaptive movement routine';
}

/**
 * Generate a fully validated, adapted workout from an Ability Profile.
 * Flow: constraints -> filter (safety) -> score+select -> order -> build.
 * Only exercises that pass the deterministic safety gate can appear.
 */
export function generateWorkout(profile: AbilityProfile): Workout {
  const constraints = buildConstraints(profile);
  const count = Math.min(Math.max(constraints.exerciseCount, 4), 10);

  let candidates = filterAllowed(EXERCISE_LIBRARY, constraints);

  // Graceful fallback: if constraints are extremely restrictive, fall back to
  // the ultra-safe seated set (still validated against the same constraints).
  if (candidates.length < 3) {
    const fallback = filterAllowed(
      FALLBACK_SAFE_IDS.map((id) => EXERCISE_LIBRARY.find((e) => e.id === id)).filter(
        (e): e is Exercise => Boolean(e),
      ),
      constraints,
    );
    candidates = [...new Map([...candidates, ...fallback].map((e) => [e.id, e])).values()];
  }

  const chosen = selectExercises(candidates, count, constraints);
  const exercises = chosen.map((e) => toWorkoutExercise(e, constraints));

  return {
    id: uid('workout'),
    createdAt: Date.now(),
    style: describeStyle(profile, constraints),
    exercises,
    adaptationsUsed: computeAdaptations(constraints),
    estimatedMinutes: estimateMinutes(chosen),
    intensity: profile.preferences.intensity,
    notes: [],
  };
}

export interface ReplacementOutcome {
  workout: Workout;
  replaced: boolean;
  message?: string;
}

/** Adjust constraints to honour the user's stated reason for replacing. */
function adjustConstraintsForReason(
  base: Constraints,
  reason: ReplacementReason,
  current: WorkoutExercise,
): Constraints {
  const next: Constraints = {
    ...base,
    avoidTags: new Set(base.avoidTags),
    preferTags: new Set(base.preferTags),
    avoidNameKeywords: [...base.avoidNameKeywords],
    availableEquipment: [...base.availableEquipment],
    targetMuscles: [...base.targetMuscles],
  };

  switch (reason) {
    case 'too-hard':
      next.maxDifficulty = 'beginner';
      next.preferTags.add('gentle-mobility').add('low-impact');
      break;
    case 'too-easy':
      next.maxDifficulty = 'moderate';
      break;
    case 'want-seated':
      next.seatedOnly = true;
      next.avoidTags.add('standing').add('standing-supported');
      next.preferTags.add('seated').add('chair-supported');
      break;
    case 'want-lower-impact':
      next.avoidTags.add('jumping').add('high-impact').add('deep-knee-bend');
      next.preferTags.add('low-impact').add('gentle-mobility');
      break;
    case 'pain':
      // Protect whatever this movement loaded.
      for (const stress of current.contraindicationTags) next.avoidTags.add(stress);
      if (current.focusRegion === 'lower') next.kneeCaution = true;
      if (current.focusRegion === 'upper') next.shoulderCaution = true;
      next.maxDifficulty = 'easy';
      next.preferTags.add('gentle-mobility').add('low-impact');
      break;
    case 'unsafe':
      next.preferTags.add('seated').add('chair-supported').add('wall-supported');
      next.maxDifficulty = 'easy';
      break;
    case 'equipment-missing':
      next.availableEquipment = next.availableEquipment.filter((item) => !current.equipment.includes(item));
      next.preferTags.add('no-equipment');
      break;
    case 'not-accessible':
      next.preferTags.add('seated').add('no-equipment').add('chair-supported');
      break;
    case 'movement-not-possible':
      next.preferTags.add('seated').add('chair-supported');
      break;
    case 'different-muscle':
    case 'unclear':
    default:
      break;
  }
  return next;
}

/**
 * Replace one exercise with a safe alternative that respects the same
 * constraints, honours the stated reason, and never repeats a rejected option.
 */
export function replaceExercise(
  workout: Workout,
  index: number,
  reason: ReplacementReason,
  profile: AbilityProfile,
): ReplacementOutcome {
  const current = workout.exercises[index];
  if (!current) return { workout, replaced: false, message: 'Could not find that exercise.' };

  const base = buildConstraints(profile);
  const constraints = adjustConstraintsForReason(base, reason, current);

  const usedIds = new Set(workout.exercises.map((e) => e.id));
  const rejected = new Set([...current.rejectedIds, current.id]);

  let candidates = filterAllowed(EXERCISE_LIBRARY, constraints).filter(
    (e) => !usedIds.has(e.id) && !rejected.has(e.id),
  );

  if (reason === 'different-muscle') {
    const filtered = candidates.filter(
      (e) => !e.targetMuscles.some((m) => current.targetMuscles.includes(m)),
    );
    if (filtered.length) candidates = filtered;
  }

  if (candidates.length === 0) {
    return {
      workout,
      replaced: false,
      message:
        'We could not find a different option that fits all your current settings. Try adjusting your profile or regenerating the routine.',
    };
  }

  const sorted = candidates
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, constraints) }))
    .sort((a, b) => {
      if (reason === 'too-hard') {
        const da = a.exercise.difficulty === 'beginner' ? 1 : 0;
        const db = b.exercise.difficulty === 'beginner' ? 1 : 0;
        if (da !== db) return db - da;
      }
      if (reason === 'too-easy') {
        const da = a.exercise.difficulty === 'moderate' ? 1 : 0;
        const db = b.exercise.difficulty === 'moderate' ? 1 : 0;
        if (da !== db) return db - da;
      }
      return b.score - a.score;
    });

  const replacement = toWorkoutExercise(sorted[0].exercise, constraints, [...rejected]);
  const exercises = [...workout.exercises];
  exercises[index] = replacement;

  return {
    workout: { ...workout, exercises },
    replaced: true,
    message: `Swapped in ${replacement.name}.`,
  };
}

/** Produce a new Ability Profile reshaped by a regeneration request. */
export function applyRegeneration(profile: AbilityProfile, mode: RegenerationMode): AbilityProfile {
  const next: AbilityProfile = {
    ...profile,
    movementsToAvoid: [...profile.movementsToAvoid],
    painAreas: [...profile.painAreas],
    equipment: [...profile.equipment],
    supportSystems: [...profile.supportSystems],
    targetMuscles: [...profile.targetMuscles],
    preferences: { ...profile.preferences },
  };
  const addAvoid = (v: string) => {
    if (!next.movementsToAvoid.includes(v)) next.movementsToAvoid.push(v);
  };
  const addArea = (v: string) => {
    if (!next.painAreas.includes(v)) next.painAreas.push(v);
  };
  const addMuscles = (list: string[]) => {
    next.targetMuscles = [...new Set([...list, ...next.targetMuscles])];
  };

  switch (mode) {
    case 'easier':
      next.preferences.intensity = 'gentle';
      break;
    case 'harder':
      next.preferences.intensity = 'moderate';
      break;
    case 'shorter':
      next.preferences.exerciseCount = Math.max(4, next.preferences.exerciseCount - 2);
      next.preferences.durationMinutes = Math.max(5, next.preferences.durationMinutes - 5);
      break;
    case 'seated':
      next.preferences.seatedOnly = true;
      break;
    case 'low-impact':
      next.preferences.intensity = 'low-impact';
      addAvoid('jumping');
      break;
    case 'no-floor':
      next.preferences.floorExercisesAllowed = false;
      addAvoid('floor');
      break;
    case 'less-knee':
      addArea('knee');
      addAvoid('deep-squats');
      addAvoid('lunges');
      break;
    case 'less-shoulder':
      addArea('shoulder');
      addAvoid('overhead');
      break;
    case 'more-core':
      addMuscles(['core']);
      break;
    case 'more-upper':
      addMuscles(['shoulders', 'arms', 'back', 'chest']);
      break;
    case 'chair-only':
      next.equipment = ['chair'];
      next.supportSystems = [...new Set([...next.supportSystems, 'chair'])];
      break;
    case 'wall-only':
      next.equipment = ['wall'];
      next.supportSystems = [...new Set([...next.supportSystems, 'wall'])];
      break;
    case 'no-equipment':
      next.equipment = ['none'];
      break;
    case 'calmer':
      next.preferences.intensity = 'gentle';
      next.preferences.coachingTone = 'calm';
      break;
    case 'strength':
      next.preferences.intensity = 'moderate';
      if (!next.goals.includes('build strength')) next.goals = ['build strength', ...next.goals];
      break;
  }
  return next;
}
