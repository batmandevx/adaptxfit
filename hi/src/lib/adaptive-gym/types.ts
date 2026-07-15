// ===========================================================================
// Adaptive Motion Gym — Core Type Definitions
// All user-facing language is intentionally body-neutral and ability-respectful.
// ===========================================================================

/** How much a limb can be used today. */
export type LimbAbility = 'full' | 'limited' | 'none';

/** Whether a posture/transition is available, possibly with support. */
export type PostureAbility = 'yes' | 'supported' | 'none';

/** Self-reported confidence level for balance. */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type Intensity = 'gentle' | 'low-impact' | 'moderate';

export type CoachingTone =
  | 'gentle'
  | 'energetic'
  | 'calm'
  | 'minimal'
  | 'motivational'
  | 'simple'
  | 'trauma-aware';

export type Difficulty = 'beginner' | 'easy' | 'moderate';

/** Light or dark UI theme. */
export type ThemeMode = 'light' | 'dark';

/** Color-vision palette to maximise distinguishability for colour blindness. */
export type ColorVisionMode = 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** Accessibility preferences. Drives global theming + voice/captions. */
export interface AccessibilitySettings {
  theme: ThemeMode;
  colorVision: ColorVisionMode;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  simpleLanguage: boolean;
  voiceGuidance: boolean;
  captions: boolean;
  soundCues: boolean;
}

export interface WorkoutPreferences {
  durationMinutes: number;
  exerciseCount: number;
  seatedOnly: boolean;
  floorExercisesAllowed: boolean;
  intensity: Intensity;
  coachingTone: CoachingTone;
}

/**
 * An approximate, stylised body profile used only to size the movement avatar.
 * It is NOT a medical measurement and stores no images. Values are gentle
 * scale factors applied to a rough avatar figure.
 */
export interface BodyProfile {
  /** Vertical scale of the avatar (~0.85 short .. 1.15 tall). */
  heightScale: number;
  /** Width / build scale of the avatar (~0.8 slim .. 1.3 broad). */
  buildScale: number;
  /** Where the estimate came from. */
  source: 'none' | 'scan' | 'manual';
}

/**
 * The Ability Profile — the heart of personalization.
 * Functional questions only; never framed as a "disability profile".
 */
export interface AbilityProfile {
  // --- Basic profile ---
  displayName?: string;
  ageRange: string;
  height?: string;
  weight?: string;
  preferredUnits: 'metric' | 'imperial';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  fitnessExperience: 'beginner' | 'some' | 'experienced';

  // --- Mobility & body movement ---
  usesWheelchair: boolean;
  standingAbility: PostureAbility;
  walkingAbility: PostureAbility;
  balanceConfidence: ConfidenceLevel;
  leftArmAbility: LimbAbility;
  rightArmAbility: LimbAbility;
  leftLegAbility: LimbAbility;
  rightLegAbility: LimbAbility;
  limbDifferenceNote?: string;
  usesProsthetic: boolean;
  prostheticNote?: string;

  // --- Areas to protect ---
  painAreas: string[];
  injuryAreas: string[];
  movementsToAvoid: string[];

  // --- Support & equipment ---
  supportSystems: string[];
  equipment: string[];

  // --- Goals & focus ---
  goals: string[];
  targetMuscles: string[];

  // --- Workout preferences ---
  preferences: WorkoutPreferences;

  // --- Optional avatar sizing (approximate, stylised, no images stored) ---
  bodyProfile?: BodyProfile;

  // --- Accessibility preferences ---
  accessibility: AccessibilitySettings;

  // --- History / metadata ---
  feedbackHistory: WorkoutFeedback[];
  completedWorkouts: number;
  confidencePoints: number;
  streak: number;
  earnedBadgeIds: string[];
  lastWorkoutDate?: string;
  createdAt: number;
  updatedAt: number;
}

/** A single inclusive exercise from the library. */
export interface Exercise {
  id: string;
  name: string;
  targetMuscles: string[];
  /** Adaptation/safety tags used by the exclusion engine and the UI labels. */
  tags: string[];
  /** Tags that make this exercise unsuitable for certain conditions. */
  contraindicationTags: string[];
  equipment: string[];
  difficulty: Difficulty;
  startingPosition: string;
  steps: string[];
  repsOrTime: string;
  /** Rough duration in seconds used for the movement-minutes estimate. */
  durationSeconds: number;
  rest: string;
  restSeconds: number;
  safetyNotes: string[];
  easierAlternative: string;
  harderProgression: string;
  seatedAlternative: string;
  voiceGuidance: string;
  visualDescription: string;
  confidenceNote: string;
  /** Posture used by the Adaptive Motion Sketch renderer. */
  posture: 'seated' | 'standing' | 'standing-supported' | 'wheelchair';
  /** Primary body emphasis for the sketch highlight. */
  focusRegion: 'upper' | 'lower' | 'core' | 'full' | 'mobility';
}

/** An exercise placed into a workout, with its live session state. */
export interface WorkoutExercise extends Exercise {
  /** Why this exercise was chosen — shown to build trust + transparency. */
  selectionReason: string;
  status: 'pending' | 'completed' | 'skipped';
  /** Ids previously rejected for this slot, so replacement never repeats them. */
  rejectedIds: string[];
}

export interface Workout {
  id: string;
  createdAt: number;
  style: string;
  exercises: WorkoutExercise[];
  /** Human-readable adaptation labels applied to the whole routine. */
  adaptationsUsed: string[];
  estimatedMinutes: number;
  intensity: Intensity;
  notes: string[];
}

/** Reasons a user can give when an exercise does not work for them. */
export type ReplacementReason =
  | 'pain'
  | 'unsafe'
  | 'too-hard'
  | 'too-easy'
  | 'equipment-missing'
  | 'movement-not-possible'
  | 'not-accessible'
  | 'want-seated'
  | 'want-lower-impact'
  | 'different-muscle'
  | 'unclear';

/** Ways the whole workout can be reshaped — a user-control feature. */
export type RegenerationMode =
  | 'easier'
  | 'harder'
  | 'shorter'
  | 'seated'
  | 'low-impact'
  | 'no-floor'
  | 'less-knee'
  | 'less-shoulder'
  | 'more-core'
  | 'more-upper'
  | 'chair-only'
  | 'wall-only'
  | 'no-equipment'
  | 'calmer'
  | 'strength';

export interface WorkoutFeedback {
  workoutId: string;
  date: string;
  ratings: string[];
  comfort: number; // 1-5
  confidence: number; // 1-5
  note?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/** Constraints derived from an Ability Profile, consumed by the safety engine. */
export interface Constraints {
  seatedOnly: boolean;
  floorAllowed: boolean;
  standingAllowed: boolean;
  lowBalance: boolean;
  oneArmOnly: boolean;
  availableArmSide: 'left' | 'right' | 'both' | 'none';
  oneLegLimited: boolean;
  kneeCaution: boolean;
  shoulderCaution: boolean;
  backCaution: boolean;
  hipCaution: boolean;
  ankleCaution: boolean;
  availableEquipment: string[];
  avoidTags: Set<string>;
  avoidNameKeywords: string[];
  preferTags: Set<string>;
  targetMuscles: string[];
  maxDifficulty: Difficulty;
  exerciseCount: number;
}

export type Screen =
  | 'landing'
  | 'intake'
  | 'plan'
  | 'session'
  | 'feedback'
  | 'summary'
  | 'profile';

/** Daily workout reminder settings (fires while the app is open). */
export interface ReminderSettings {
  enabled: boolean;
  /** 24h time 'HH:MM'. */
  time: string;
  /** Last date (YYYY-MM-DD) a reminder was shown, to avoid repeats. */
  lastNotified?: string;
}
