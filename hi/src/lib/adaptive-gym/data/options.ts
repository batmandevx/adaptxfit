// Static option sets for the intake form. Centralised so labels stay consistent
// and inclusive across the whole module.

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

export const AGE_RANGES: Option[] = [
  { value: 'under-18', label: 'Under 18' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65-plus', label: '65+' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

export const ACTIVITY_LEVELS: Option[] = [
  { value: 'sedentary', label: 'Mostly resting', hint: 'Little movement right now' },
  { value: 'light', label: 'Light', hint: 'Some gentle movement' },
  { value: 'moderate', label: 'Moderate', hint: 'Active a few times a week' },
  { value: 'active', label: 'Active', hint: 'Moving most days' },
];

export const EXPERIENCE_LEVELS: Option[] = [
  { value: 'beginner', label: 'New to this', hint: 'Just getting started' },
  { value: 'some', label: 'Some experience' },
  { value: 'experienced', label: 'Experienced' },
];

export const POSTURE_OPTIONS: Option[] = [
  { value: 'yes', label: 'Comfortably' },
  { value: 'supported', label: 'With support' },
  { value: 'none', label: 'Not right now' },
];

export const CONFIDENCE_OPTIONS: Option[] = [
  { value: 'low', label: 'Building it', hint: 'I prefer plenty of support' },
  { value: 'medium', label: 'Steady', hint: 'I am okay with some support' },
  { value: 'high', label: 'Confident', hint: 'I feel stable' },
];

export const LIMB_OPTIONS: Option[] = [
  { value: 'full', label: 'Full use' },
  { value: 'limited', label: 'Limited use' },
  { value: 'none', label: 'Not available' },
];

// Areas the user may want to protect. Functional, not diagnostic.
export const BODY_AREAS: Option[] = [
  { value: 'neck', label: 'Neck' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'back', label: 'Back' },
  { value: 'hip', label: 'Hip' },
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'wrist', label: 'Wrist' },
];

export const MOVEMENTS_TO_AVOID: Option[] = [
  { value: 'standing', label: 'Standing movements' },
  { value: 'floor', label: 'Floor exercises' },
  { value: 'jumping', label: 'Jumping' },
  { value: 'running', label: 'Running' },
  { value: 'deep-squats', label: 'Deep squats' },
  { value: 'lunges', label: 'Lunges' },
  { value: 'overhead', label: 'Overhead movements' },
  { value: 'fast-direction-change', label: 'Fast direction changes' },
  { value: 'two-arm-loading', label: 'Two-arm loaded moves' },
];

export const SUPPORT_OPTIONS: Option[] = [
  { value: 'chair', label: 'Chair' },
  { value: 'wall', label: 'Wall' },
  { value: 'wheelchair', label: 'Wheelchair' },
  { value: 'table', label: 'Table' },
  { value: 'cane', label: 'Cane' },
  { value: 'walker', label: 'Walker' },
  { value: 'prosthetic', label: 'Prosthetic' },
  { value: 'partner', label: 'Partner or helper' },
];

export const EQUIPMENT_OPTIONS: Option[] = [
  { value: 'none', label: 'No equipment' },
  { value: 'chair', label: 'Chair' },
  { value: 'wall', label: 'Wall' },
  { value: 'resistance band', label: 'Resistance band' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'table', label: 'Table' },
];

export const GOAL_OPTIONS: Option[] = [
  { value: 'build strength', label: 'Build strength' },
  { value: 'improve mobility', label: 'Improve mobility' },
  { value: 'improve stamina', label: 'Improve stamina' },
  { value: 'increase confidence', label: 'Increase confidence' },
  { value: 'gentle daily movement', label: 'Gentle daily movement' },
  { value: 'reduce stiffness', label: 'Reduce stiffness' },
  { value: 'stay consistent', label: 'Stay consistent' },
];

export const MUSCLE_OPTIONS: Option[] = [
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'core', label: 'Core' },
  { value: 'hips', label: 'Hips' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'thighs', label: 'Thighs' },
  { value: 'calves', label: 'Calves' },
];

export const INTENSITY_OPTIONS: Option[] = [
  { value: 'gentle', label: 'Gentle', hint: 'Easy and comfortable' },
  { value: 'low-impact', label: 'Low impact', hint: 'Steady, no harsh moves' },
  { value: 'moderate', label: 'Moderate', hint: 'A bit more challenge' },
];

export const COACHING_TONES: Option[] = [
  { value: 'gentle', label: 'Gentle', hint: 'Soft and reassuring' },
  { value: 'calm', label: 'Calm', hint: 'Quiet and steady' },
  { value: 'energetic', label: 'Energetic', hint: 'Upbeat and warm' },
  { value: 'motivational', label: 'Motivational', hint: 'Encouraging' },
  { value: 'minimal', label: 'Minimal', hint: 'Just the essentials' },
  { value: 'simple', label: 'Simple language', hint: 'Short, clear words' },
  { value: 'trauma-aware', label: 'Trauma-aware', hint: 'Extra gentle and choice-led' },
];

export const DURATION_OPTIONS: Option[] = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
];

export const EXERCISE_COUNT_OPTIONS: Option[] = [
  { value: '5', label: '5 exercises' },
  { value: '6', label: '6 exercises' },
  { value: '8', label: '8 exercises' },
  { value: '10', label: '10 exercises' },
];

export const REPLACEMENT_REASONS: Option[] = [
  { value: 'pain', label: 'It causes pain' },
  { value: 'unsafe', label: 'It feels unsafe' },
  { value: 'too-hard', label: 'It is too hard' },
  { value: 'too-easy', label: 'It is too easy' },
  { value: 'equipment-missing', label: 'I do not have the equipment' },
  { value: 'movement-not-possible', label: 'The movement is not possible for me' },
  { value: 'not-accessible', label: 'It is not accessible enough' },
  { value: 'want-seated', label: 'I want a seated version' },
  { value: 'want-lower-impact', label: 'I want a lower-impact version' },
  { value: 'different-muscle', label: 'I want a different muscle focus' },
  { value: 'unclear', label: 'The instructions are unclear' },
];

export const FEEDBACK_OPTIONS: Option[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'liked-it', label: 'I liked it' },
  { value: 'tiring-manageable', label: 'Tiring but manageable' },
  { value: 'too-easy', label: 'Too easy' },
  { value: 'too-hard', label: 'Too hard' },
  { value: 'painful', label: 'Painful' },
  { value: 'unstable', label: 'Felt unstable' },
  { value: 'not-accessible', label: 'Not accessible enough' },
  { value: 'want-shorter', label: 'Want a shorter version next time' },
  { value: 'want-seated', label: 'Want more seated exercises' },
  { value: 'less-knee', label: 'Want less pressure on knees' },
  { value: 'less-shoulder', label: 'Want less pressure on shoulders' },
  { value: 'more-rest', label: 'Want more rest' },
  { value: 'more-strength', label: 'Want more strength focus' },
  { value: 'more-mobility', label: 'Want more mobility focus' },
];

export const REGENERATION_OPTIONS: Option[] = [
  { value: 'easier', label: 'Make it easier' },
  { value: 'harder', label: 'Make it harder' },
  { value: 'shorter', label: 'Make it shorter' },
  { value: 'seated', label: 'Make it seated' },
  { value: 'low-impact', label: 'Make it low-impact' },
  { value: 'no-floor', label: 'Remove floor moves' },
  { value: 'less-knee', label: 'Less knee pressure' },
  { value: 'less-shoulder', label: 'Less shoulder use' },
  { value: 'more-core', label: 'More core focus' },
  { value: 'more-upper', label: 'More upper body' },
  { value: 'chair-only', label: 'Use only a chair' },
  { value: 'wall-only', label: 'Use only a wall' },
  { value: 'no-equipment', label: 'Use no equipment' },
  { value: 'calmer', label: 'Calmer workout' },
  { value: 'strength', label: 'Strength-focused' },
];

// Friendly, human-readable labels for adaptation tags shown on exercise cards.
export const TAG_LABELS: Record<string, string> = {
  seated: 'Seated',
  'wheelchair-friendly': 'Wheelchair-friendly',
  'chair-supported': 'Chair-supported',
  'wall-supported': 'Wall-supported',
  'standing-supported': 'Standing, supported',
  standing: 'Standing',
  'low-impact': 'Low impact',
  'no-floor': 'No floor needed',
  floor: 'Floor-based',
  'upper-body': 'Upper body',
  'lower-body': 'Lower body',
  core: 'Core-focused',
  'gentle-mobility': 'Gentle mobility',
  mobility: 'Mobility',
  'balance-support': 'Balance support',
  'resistance-band': 'Resistance band',
  'no-equipment': 'No equipment',
  'single-arm-friendly': 'One-arm friendly',
  'two-arm-required': 'Needs two arms',
  'deep-knee-bend': 'Deep knee bend',
  lunge: 'Lunge',
  jumping: 'Jumping',
  running: 'Running',
  'unsupported-balance': 'Unsupported balance',
};
