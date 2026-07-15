import type { AbilityProfile, AccessibilitySettings, WorkoutPreferences } from '../types';

export function createDefaultAccessibility(): AccessibilitySettings {
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    theme: prefersDark ? 'dark' : 'light',
    colorVision: 'default',
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    dyslexiaFont: false,
    simpleLanguage: false,
    voiceGuidance: false,
    captions: true,
    soundCues: false,
  };
}

export function createDefaultPreferences(): WorkoutPreferences {
  return {
    durationMinutes: 15,
    exerciseCount: 8,
    seatedOnly: false,
    floorExercisesAllowed: false,
    intensity: 'low-impact',
    coachingTone: 'gentle',
  };
}

/** A blank, safe-by-default Ability Profile used for new users and Quick Start. */
export function createDefaultProfile(): AbilityProfile {
  const now = Date.now();
  return {
    displayName: '',
    ageRange: '25-34',
    height: '',
    weight: '',
    preferredUnits: 'metric',
    activityLevel: 'light',
    fitnessExperience: 'beginner',

    usesWheelchair: false,
    standingAbility: 'yes',
    walkingAbility: 'yes',
    balanceConfidence: 'medium',
    leftArmAbility: 'full',
    rightArmAbility: 'full',
    leftLegAbility: 'full',
    rightLegAbility: 'full',
    limbDifferenceNote: '',
    usesProsthetic: false,
    prostheticNote: '',

    painAreas: [],
    injuryAreas: [],
    movementsToAvoid: ['floor'],

    supportSystems: ['chair'],
    equipment: ['chair'],

    goals: ['build strength', 'increase confidence'],
    targetMuscles: ['core', 'back'],

    preferences: createDefaultPreferences(),
    accessibility: createDefaultAccessibility(),
    bodyProfile: { heightScale: 1, buildScale: 1, source: 'none' },

    feedbackHistory: [],
    completedWorkouts: 0,
    confidencePoints: 0,
    streak: 0,
    earnedBadgeIds: [],
    lastWorkoutDate: undefined,
    createdAt: now,
    updatedAt: now,
  };
}
