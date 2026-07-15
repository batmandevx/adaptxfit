import type { AbilityProfile, Constraints, Difficulty } from '../types';

const has = (list: string[], value: string) => list.includes(value);

/** Map support/equipment selections into a single "what is available" set. */
function buildEquipment(profile: AbilityProfile, seatedOnly: boolean): string[] {
  const set = new Set<string>();
  for (const item of profile.equipment) {
    if (item && item !== 'none') set.add(item);
  }
  // Support systems can double as equipment (a wall to lean on, a chair to hold).
  for (const item of profile.supportSystems) {
    if (['chair', 'wall', 'table'].includes(item)) set.add(item);
  }
  // A seated user always has a seat available for seated movements.
  if (seatedOnly || profile.usesWheelchair) set.add('chair');
  return [...set];
}

/**
 * Derive a deterministic set of movement constraints from an Ability Profile.
 * This is the single source of truth the safety engine validates against — it
 * never depends on any LLM output.
 */
export function buildConstraints(profile: AbilityProfile): Constraints {
  const protectedAreas = [...profile.painAreas, ...profile.injuryAreas];
  const avoid = profile.movementsToAvoid;

  const seatedOnly =
    profile.preferences.seatedOnly ||
    profile.usesWheelchair ||
    profile.standingAbility === 'none';

  const floorAllowed = profile.preferences.floorExercisesAllowed && !has(avoid, 'floor');
  const standingAllowed = !seatedOnly && profile.standingAbility !== 'none';
  const lowBalance = profile.balanceConfidence === 'low';

  const leftArmOut = profile.leftArmAbility === 'none';
  const rightArmOut = profile.rightArmAbility === 'none';
  const oneArmOnly = leftArmOut || rightArmOut || has(avoid, 'two-arm-loading');

  let availableArmSide: Constraints['availableArmSide'] = 'both';
  if (leftArmOut && rightArmOut) availableArmSide = 'none';
  else if (rightArmOut) availableArmSide = 'left';
  else if (leftArmOut) availableArmSide = 'right';

  const oneLegLimited =
    profile.leftLegAbility !== 'full' || profile.rightLegAbility !== 'full';

  const kneeCaution = has(protectedAreas, 'knee') || has(avoid, 'deep-squats') || has(avoid, 'lunges');
  const shoulderCaution = has(protectedAreas, 'shoulder') || has(avoid, 'overhead');
  const backCaution = has(protectedAreas, 'back');
  const hipCaution = has(protectedAreas, 'hip');
  const ankleCaution = has(protectedAreas, 'ankle');

  const avoidTags = new Set<string>();
  const preferTags = new Set<string>();
  const avoidNameKeywords: string[] = [];

  if (!floorAllowed) {
    avoidTags.add('floor');
    avoidNameKeywords.push('plank', 'push-up', 'crunch', 'burpee', 'mountain climber');
  }
  if (seatedOnly) {
    avoidTags.add('standing');
    avoidNameKeywords.push('squat', 'lunge', 'jumping', 'running', 'burpee');
    preferTags.add('seated').add('wheelchair-friendly').add('chair-supported');
  }
  if (lowBalance) {
    avoidTags.add('unsupported-balance').add('single-leg').add('jumping').add('fast-direction-change').add('high-impact');
    // Prefer supported movement. For users who can still stand we favour
    // chair/wall-supported standing rather than forcing everything seated.
    preferTags.add('chair-supported').add('wall-supported').add('balance-support');
    if (seatedOnly) preferTags.add('seated');
  }
  if (oneLegLimited) {
    avoidTags.add('single-leg').add('unsupported-balance');
  }
  if (oneArmOnly) {
    avoidTags.add('two-arm-required');
    preferTags.add('single-arm-friendly');
  }
  if (kneeCaution) {
    avoidTags.add('deep-knee-bend').add('lunge').add('jumping').add('high-impact').add('running');
    avoidNameKeywords.push('deep squat', 'lunge', 'jump');
    // Knee-friendly does not mean seated-only — supported standing is welcome.
    preferTags.add('low-impact').add('chair-supported');
    if (seatedOnly) preferTags.add('seated');
  }
  if (shoulderCaution) {
    avoidTags.add('overhead').add('heavy-push').add('fast-arm-swing');
    avoidNameKeywords.push('overhead', 'shoulder press');
    preferTags.add('gentle-mobility').add('low-impact');
  }
  if (has(avoid, 'jumping')) avoidTags.add('jumping').add('high-impact');
  if (has(avoid, 'running')) avoidTags.add('running');
  if (has(avoid, 'fast-direction-change')) avoidTags.add('fast-direction-change');

  if (profile.preferences.intensity === 'gentle') {
    preferTags.add('gentle-mobility').add('low-impact');
  }
  if (profile.equipment.length === 1 && profile.equipment[0] === 'none') {
    preferTags.add('no-equipment');
  }

  const maxDifficulty: Difficulty =
    profile.preferences.intensity === 'gentle' ? 'easy' : 'moderate';

  return {
    seatedOnly,
    floorAllowed,
    standingAllowed,
    lowBalance,
    oneArmOnly,
    availableArmSide,
    oneLegLimited,
    kneeCaution,
    shoulderCaution,
    backCaution,
    hipCaution,
    ankleCaution,
    availableEquipment: buildEquipment(profile, seatedOnly),
    avoidTags,
    avoidNameKeywords,
    preferTags,
    targetMuscles: profile.targetMuscles,
    maxDifficulty,
    exerciseCount: profile.preferences.exerciseCount,
  };
}

/** The set of "stresses / requirements" the user must avoid, per their profile. */
export function buildAvoidStress(constraints: Constraints): Set<string> {
  const stress = new Set<string>();
  if (constraints.kneeCaution) stress.add('knee-stress');
  if (constraints.shoulderCaution) stress.add('shoulder-stress');
  if (constraints.backCaution) stress.add('back-stress');
  if (constraints.hipCaution) stress.add('hip-stress');
  if (constraints.ankleCaution) stress.add('ankle-stress');
  if (constraints.seatedOnly) stress.add('requires-standing');
  if (!constraints.floorAllowed) stress.add('requires-floor');
  if (constraints.oneArmOnly) stress.add('requires-two-arms');
  if (constraints.lowBalance || constraints.oneLegLimited) stress.add('requires-balance');
  return stress;
}
