import type { AbilityProfile, Badge, Workout, WorkoutFeedback } from '../types';

// Inclusive badge catalogue. Every badge celebrates effort, adaptation and
// consistency — never appearance, weight or "pushing through pain".
export const BADGES: Badge[] = [
  { id: 'first-movement', name: 'First Movement Completed', description: 'You completed your first adapted session.', icon: '🌱' },
  { id: 'your-pace', name: 'Your Pace Champion', description: 'You moved at a pace that worked for you.', icon: '🧭' },
  { id: 'gentle-strength', name: 'Gentle Strength', description: 'You built strength with a gentle approach.', icon: '🪷' },
  { id: 'supported-motion', name: 'Supported Motion', description: 'You used support to move with confidence.', icon: '🤝' },
  { id: 'confidence-builder', name: 'Confidence Builder', description: 'You reported growing confidence.', icon: '✨' },
  { id: 'seated-strength', name: 'Seated Strength', description: 'You completed a seated strength session.', icon: '🪑' },
  { id: 'mobility-explorer', name: 'Mobility Explorer', description: 'You focused on mobility and ease.', icon: '🌀' },
  { id: 'pain-aware', name: 'Pain-Aware Progress', description: 'You protected sensitive areas while moving.', icon: '🛡️' },
  { id: 'accessible-athlete', name: 'Accessible Athlete', description: 'You used accessibility features to move your way.', icon: '🦾' },
  { id: 'calm-completion', name: 'Calm Completion', description: 'You finished a calm, low-impact session.', icon: '🌙' },
  { id: 'strength-every-form', name: 'Strength in Every Form', description: 'You showed strength looks different for everyone.', icon: '💎' },
  { id: 'motion-streak', name: 'Motion Streak', description: 'You moved on consecutive days.', icon: '🔥' },
  { id: 'adapted-complete', name: 'Adapted Workout Completed', description: 'You completed a fully adapted routine.', icon: '🎖️' },
];

export const badgeById = (id: string): Badge | undefined => BADGES.find((b) => b.id === id);

/**
 * Decide which badges a completed workout has earned. Pure + deterministic so
 * it is easy to test and reason about.
 */
export function evaluateBadges(
  profile: AbilityProfile,
  workout: Workout,
  feedback: WorkoutFeedback,
): Badge[] {
  const earned = new Set<string>();
  const already = new Set(profile.earnedBadgeIds);

  const completedCount = workout.exercises.filter((e) => e.status !== 'skipped').length;
  const isSeated = workout.exercises.every((e) => e.posture === 'seated');
  const isCalm = workout.intensity === 'gentle';
  const usedSupport = workout.exercises.some((e) =>
    e.tags.some((t) => ['chair-supported', 'wall-supported', 'balance-support', 'standing-supported'].includes(t)),
  );
  const usedAccessibility =
    profile.accessibility.highContrast ||
    profile.accessibility.largeText ||
    profile.accessibility.reducedMotion ||
    profile.accessibility.dyslexiaFont ||
    profile.accessibility.simpleLanguage ||
    profile.accessibility.voiceGuidance ||
    profile.accessibility.soundCues ||
    profile.accessibility.theme === 'dark' ||
    profile.accessibility.colorVision !== 'default';
  const protectedAreas = profile.painAreas.length > 0 || profile.injuryAreas.length > 0;
  const mobilityFocused = workout.exercises.filter((e) => e.focusRegion === 'mobility').length >= 2;

  if (profile.completedWorkouts === 0) earned.add('first-movement');
  earned.add('your-pace');
  earned.add('adapted-complete');
  if (completedCount > 0) earned.add('gentle-strength');
  if (usedSupport) earned.add('supported-motion');
  if (feedback.confidence >= 3) earned.add('confidence-builder');
  if (isSeated) earned.add('seated-strength');
  if (mobilityFocused) earned.add('mobility-explorer');
  if (protectedAreas) earned.add('pain-aware');
  if (usedAccessibility) earned.add('accessible-athlete');
  if (isCalm) earned.add('calm-completion');
  earned.add('strength-every-form');
  if (profile.streak + 1 >= 2) earned.add('motion-streak');

  // Surface newly earned badges first, but always include the core completion set.
  return [...earned]
    .filter((id) => !already.has(id) || ['your-pace', 'adapted-complete'].includes(id))
    .map((id) => badgeById(id))
    .filter((b): b is Badge => Boolean(b));
}
