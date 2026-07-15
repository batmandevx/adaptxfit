import type { AbilityProfile, Exercise } from '../types';
import type { SketchAnimation } from '../components/MotionSketch';

// ===========================================================================
// Optional AI image generation for movement tutorials.
//
// Provider: Pollinations.ai — a FREE, keyless text-to-image endpoint that
// returns an image directly from a GET URL (no account, no API key, no cost).
// Override the base via VITE_IMAGE_GEN_URL to swap in another provider.
//
// PRIVACY: only a TEXT description of the movement + the user's support needs
// (e.g. "a person using a wheelchair") is sent. The user's photo is NEVER sent.
// These are AI-generated illustrations, not a photoreal scan of the user.
// Entirely optional and on-demand, with a graceful fallback to the stylised twin.
// ===========================================================================

const DEFAULT_BASE = 'https://image.pollinations.ai/prompt/';

const BASE = (import.meta.env.VITE_IMAGE_GEN_URL as string | undefined) ?? DEFAULT_BASE;

/** Whether an image-gen provider is configured (always true with the free default). */
export const IMAGE_GEN_AVAILABLE = Boolean(BASE);

/** Body-neutral description of the mover, derived from the Ability Profile. */
function describePerson(profile: AbilityProfile): string {
  if (profile.usesWheelchair) return 'a person using a wheelchair';
  const oneArm = profile.leftArmAbility === 'none' || profile.rightArmAbility === 'none';
  if (oneArm) return 'a person using one arm';
  if (profile.preferences.seatedOnly || profile.standingAbility === 'none') {
    return 'a person seated on a sturdy chair';
  }
  return 'a person';
}

/** Build an inclusive, body-neutral illustration prompt for a movement. */
export function buildMovementPrompt(exercise: Exercise, profile: AbilityProfile): string {
  const who = describePerson(profile);
  const muscles = exercise.targetMuscles.slice(0, 2).join(' and ');
  return [
    `clean modern flat vector instructional fitness illustration of ${who}`,
    `performing ${exercise.name.toLowerCase()}`,
    muscles ? `a gentle ${muscles} exercise` : 'a gentle exercise',
    'full body, side view, friendly and inclusive',
    'soft teal and indigo palette, minimal light background',
    'no text, no words, no logos',
  ].join(', ');
}

/** Stable numeric seed from an exercise id so each move keeps a consistent image. */
export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 100000;
}

export interface ImageOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/** Build the provider image URL for a prompt (loaded directly by an <img>). */
export function movementImageUrl(prompt: string, opts: ImageOptions = {}): string {
  const { width = 384, height = 384, seed = 0 } = opts;
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: 'true',
    model: 'flux',
  });
  return `${BASE}${encodeURIComponent(prompt)}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Animated movement = several AI keyframes looped.
//
// For each movement we describe its KEY POSES (e.g. jumping jacks = arms-down
// then arms-up). We render one AI image per pose, all sharing the SAME seed so
// the character/outfit/style stay consistent, then loop the frames in the UI to
// create a simple animation of the exercise.
// ---------------------------------------------------------------------------

/** Key poses (frames) that make up one loop of each movement type. */
const POSES_BY_ANIMATION: Record<SketchAnimation, string[]> = {
  'arm-reach': [
    'with both arms relaxed down by the sides',
    'reaching one arm straight forward at chest height',
  ],
  'arm-pull': [
    'with both arms extended forward holding a resistance band',
    'with the elbows drawn back and the shoulder blades squeezed together',
  ],
  'arm-press': [
    'with both hands held in close to the chest',
    'with both arms pressed straight out in front',
  ],
  'arm-curl': [
    'with both arms straight down holding a band',
    'with both forearms curled up toward the shoulders',
  ],
  punch: [
    'extending the left arm forward in a slow controlled punch',
    'extending the right arm forward in a slow controlled punch',
  ],
  'shoulder-roll': [
    'with the shoulders relaxed and down',
    'with the shoulders lifted up and rolled gently back',
  ],
  'neck-tilt': [
    'gently tilting the head toward the left shoulder',
    'gently tilting the head toward the right shoulder',
  ],
  'torso-rotate': [
    'with the upper body gently rotated to the left',
    'with the upper body gently rotated to the right',
  ],
  'side-bend': [
    'bending gently to the left side',
    'bending gently to the right side',
  ],
  'knee-lift': [
    'with both feet resting flat down',
    'lifting one knee up toward the chest',
  ],
  march: [
    'lifting the left knee in a gentle march',
    'lifting the right knee in a gentle march',
  ],
  'heel-raise': [
    'with the heels flat and feet resting down',
    'with the heels lifted, rising up onto the toes',
  ],
  'leg-side': [
    'with both legs together',
    'lifting one leg gently out to the side',
  ],
  'leg-back': [
    'with both legs together',
    'pressing one leg gently straight back',
  ],
  'sit-stand': [
    'seated on a sturdy chair',
    'standing up tall next to the chair',
  ],
  'calf-raise': [
    'standing with the heels flat, lightly holding a chair for support',
    'rising up onto the toes, lightly holding a chair for support',
  ],
  none: ['holding a steady, controlled position'],
};

/** Full prompt for a single pose/frame of a movement. */
function posePrompt(exercise: Exercise, profile: AbilityProfile, pose: string): string {
  const who = describePerson(profile);
  const muscles = exercise.targetMuscles.slice(0, 2).join(' and ');
  return [
    `clean modern flat vector instructional fitness illustration of ${who}`,
    `performing ${exercise.name.toLowerCase()}`,
    pose,
    'captured mid-movement in a clear, dynamic action pose that obviously shows the exercise',
    muscles ? `a gentle ${muscles} exercise` : 'a gentle exercise',
    // Force ONE figure in ONE pose per image. Phrases like "every frame" make
    // the model render a multi-pose grid/contact-sheet, which breaks the loop.
    'a single full-body figure, exactly one person, one pose only, side view, centered composition',
    'not a grid, not a collage, not a storyboard, no multiple poses, no panels, no split frames, no thumbnails',
    'consistent flat vector style, soft teal and indigo palette, plain solid background',
    'no text, no words, no logos',
  ].join(', ');
}

/** The list of pose phrases that make up one loop of a movement. */
export function posesForAnimation(animation: SketchAnimation): string[] {
  return POSES_BY_ANIMATION[animation] ?? POSES_BY_ANIMATION.none;
}

/**
 * One representative still of the movement — its peak / active pose, captured
 * as a dynamic action shot. We deliberately use a SINGLE coherent image: two
 * independently generated AI stills never align, so alternating them flickers
 * instead of looking like one body moving. The animated SVG sketch provides the
 * actual motion.
 */
export function movementImageForExercise(
  exercise: Exercise,
  profile: AbilityProfile,
  animation: SketchAnimation,
  seed: number,
  opts: ImageOptions = {},
): string {
  const poses = posesForAnimation(animation);
  const pose = poses[poses.length - 1]; // the peak/active pose best shows the move
  return movementImageUrl(posePrompt(exercise, profile, pose), { ...opts, seed });
}
