import type { AbilityProfile } from '../types';
import { createDefaultProfile } from './defaults';

export interface DemoPersona {
  id: string;
  name: string;
  buttonLabel: string;
  description: string;
  /** Plain-language summary chips for the landing cards. */
  highlights: string[];
  profile: AbilityProfile;
  mustAvoid: string[];
  expectedExerciseTypes: string[];
}

/** Persona definitions may supply partial preferences/accessibility; the rest
 * is filled from safe defaults. */
type PersonaInput = Partial<Omit<AbilityProfile, 'preferences' | 'accessibility'>> & {
  preferences?: Partial<AbilityProfile['preferences']>;
  accessibility?: Partial<AbilityProfile['accessibility']>;
};

function withDefaults(partial: PersonaInput): AbilityProfile {
  const base = createDefaultProfile();
  return {
    ...base,
    ...partial,
    preferences: { ...base.preferences, ...(partial.preferences ?? {}) },
    accessibility: { ...base.accessibility, ...(partial.accessibility ?? {}) },
  };
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'wheelchair-upper-body',
    name: 'Wheelchair Upper-Body Strength',
    buttonLabel: 'Try Wheelchair Strength Demo',
    description: 'A seated wheelchair user building upper-body and core strength with a resistance band.',
    highlights: ['Seated only', 'No floor', 'Resistance band', 'Upper body + core'],
    profile: withDefaults({
      displayName: 'Demo — Wheelchair Strength',
      ageRange: '25-34',
      activityLevel: 'light',
      fitnessExperience: 'beginner',
      usesWheelchair: true,
      standingAbility: 'none',
      walkingAbility: 'none',
      balanceConfidence: 'low',
      leftArmAbility: 'full',
      rightArmAbility: 'full',
      leftLegAbility: 'limited',
      rightLegAbility: 'limited',
      painAreas: [],
      injuryAreas: [],
      movementsToAvoid: ['standing', 'floor', 'jumping'],
      supportSystems: ['wheelchair'],
      equipment: ['resistance band'],
      goals: ['build strength', 'improve stamina', 'increase confidence'],
      targetMuscles: ['shoulders', 'back', 'arms', 'core'],
      preferences: {
        durationMinutes: 20,
        exerciseCount: 8,
        seatedOnly: true,
        floorExercisesAllowed: false,
        intensity: 'gentle',
        coachingTone: 'gentle',
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        dyslexiaFont: false,
        simpleLanguage: false,
        voiceGuidance: true,
        captions: true,
      },
    }),
    mustAvoid: ['squats', 'lunges', 'running', 'jumping', 'planks', 'burpees', 'floor push-ups'],
    expectedExerciseTypes: [
      'seated band rows',
      'seated shoulder mobility',
      'seated punches',
      'seated core rotations',
      'wheelchair-friendly stretches',
    ],
  },
  {
    id: 'one-arm-beginner',
    name: 'One-Arm Beginner / Veteran',
    buttonLabel: 'Try One-Arm Beginner Demo',
    description: 'A standing user with one available arm, rebuilding strength and confidence with chair and wall support.',
    highlights: ['One-arm friendly', 'Chair + wall', 'No floor', 'Gentle strength'],
    profile: withDefaults({
      displayName: 'Demo — One-Arm Beginner',
      ageRange: '35-44',
      activityLevel: 'light',
      fitnessExperience: 'beginner',
      usesWheelchair: false,
      standingAbility: 'yes',
      walkingAbility: 'yes',
      balanceConfidence: 'medium',
      leftArmAbility: 'full',
      rightArmAbility: 'none',
      leftLegAbility: 'full',
      rightLegAbility: 'full',
      injuryAreas: [],
      movementsToAvoid: ['two-arm-loading', 'floor'],
      supportSystems: ['chair', 'wall'],
      equipment: ['chair', 'wall', 'resistance band'],
      goals: ['build strength', 'increase confidence', 'gentle daily movement'],
      targetMuscles: ['thighs', 'core', 'arms', 'back'],
      preferences: {
        durationMinutes: 15,
        exerciseCount: 6,
        seatedOnly: false,
        floorExercisesAllowed: false,
        intensity: 'gentle',
        coachingTone: 'motivational',
      },
    }),
    mustAvoid: ['standard push-ups', 'pull-ups', 'two-arm planks', 'two-handed dumbbell moves'],
    expectedExerciseTypes: [
      'one-arm wall press',
      'chair-supported lower-body movement',
      'single-arm band exercises',
      'standing supported core stability',
    ],
  },
  {
    id: 'knee-friendly-low-impact',
    name: 'Knee-Friendly Low Impact',
    buttonLabel: 'Try Knee-Friendly Low Impact Demo',
    description: 'A standing user with knee sensitivity who wants low-impact strength without jumping, deep squats or lunges.',
    highlights: ['Knee-friendly', 'Low impact', 'Chair + band', 'Hips + glutes + core'],
    profile: withDefaults({
      displayName: 'Demo — Knee-Friendly',
      ageRange: '25-34',
      activityLevel: 'moderate',
      fitnessExperience: 'beginner',
      usesWheelchair: false,
      standingAbility: 'yes',
      walkingAbility: 'yes',
      balanceConfidence: 'medium',
      leftArmAbility: 'full',
      rightArmAbility: 'full',
      leftLegAbility: 'limited',
      rightLegAbility: 'full',
      painAreas: ['knee'],
      injuryAreas: ['knee'],
      movementsToAvoid: ['jumping', 'deep-squats', 'lunges', 'running'],
      supportSystems: ['chair', 'wall'],
      equipment: ['chair', 'resistance band'],
      goals: ['build strength', 'improve mobility', 'increase confidence'],
      targetMuscles: ['hips', 'glutes', 'core', 'back'],
      preferences: {
        durationMinutes: 20,
        exerciseCount: 8,
        seatedOnly: false,
        floorExercisesAllowed: false,
        intensity: 'low-impact',
        coachingTone: 'calm',
      },
    }),
    mustAvoid: ['jumping', 'lunges', 'deep squats', 'burpees', 'running'],
    expectedExerciseTypes: [
      'seated leg extensions',
      'hip mobility',
      'glute activation',
      'low-impact core work',
      'shallow chair sit-to-stand if safe',
    ],
  },
];

export const personaById = (id: string): DemoPersona | undefined =>
  DEMO_PERSONAS.find((p) => p.id === id);
