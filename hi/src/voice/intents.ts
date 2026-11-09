/**
 * Voice Commander 2.0 — typed intent table.
 *
 * Pure data + types only: no React, no DOM, no store imports, so the table can
 * be unit-tested in plain Node and reused by the fuzzy matcher (commander.ts).
 *
 * i18n seam (Pillar B): the table is the English default. A locale pack can
 * build a translated table with `buildIntentTable(overrides)` or simply pass
 * its own `IntentDef[]` to `matchCommand(text, table)` — nothing here imports
 * from `src/lib/i18n`, so there is no coupling either direction.
 */

/** Mirrors AppSection in src/stores/app-store.ts (kept as a local union so the
 *  voice layer stays dependency-free and Node-testable). */
export type SectionId =
  | 'home'
  | 'dashboard'
  | 'body-scan'
  | 'live-coach'
  | 'exercises'
  | 'adaptive-workout'
  | 'mind-gym'
  | 'breathing'
  | 'mood'
  | 'nutrition'
  | 'community'
  | 'wearable'
  | 'crisis';

export type VoiceIntentType =
  | 'navigate'
  | 'session.start'
  | 'session.pause'
  | 'session.stop'
  | 'session.next'
  | 'session.repeat'
  | 'log.water'
  | 'log.pain'
  | 'system.help'
  | 'system.back'
  | 'system.stopListening';

/** A successfully matched intent. */
export interface VoiceIntent {
  type: VoiceIntentType;
  /** Target section for `navigate` intents. */
  section?: SectionId;
  /** Human-readable label of what will happen (used in the mic indicator). */
  label: string;
  /** The pattern/phrase that matched (debugging + UI echo). */
  matched: string;
  /** 0–1 confidence. Exact = 1, phrase-contained ≈ 0.9, prefix ≈ 0.8, fuzzy ≤ 0.79. */
  confidence: number;
}

export interface IntentDef {
  type: VoiceIntentType;
  /** Only for navigate intents. */
  section?: SectionId;
  /** Short label shown in UI ("Open Live Coach", "Start session"). */
  label: string;
  /** Exact / included phrases (normalized before compare). Multiple phrasings. */
  patterns: string[];
  /** Content words used by the fuzzy token-overlap stage. */
  keywords: string[];
  /** Higher priority wins when two intents match with equal confidence. */
  priority: number;
  /** Spoken confirmation template. `{section}` is replaced with the label. */
  confirmation: string;
  /** One-line description for the help overlay. */
  description: string;
  /** Example phrases listed in the help overlay. */
  examples: string[];
}

// ── Navigation intents (one per section) ─────────────────────────────────────

function nav(
  section: SectionId,
  label: string,
  spoken: string,
  patterns: string[],
  keywords: string[],
): IntentDef {
  return {
    type: 'navigate',
    section,
    label: `Open ${label}`,
    patterns,
    keywords,
    priority: 10,
    confirmation: `Opening ${spoken}.`,
    description: `Go to ${label}`,
    examples: patterns.slice(0, 2),
  };
}

// ── Default English intent table ─────────────────────────────────────────────

export const INTENT_TABLE: IntentDef[] = [
  // Session control (highest priority — action commands beat navigation)
  {
    type: 'session.start',
    label: 'Start session',
    patterns: [
      'start workout', 'start the workout', 'start session', 'start exercise',
      'begin workout', 'begin session', 'start training', 'start coaching',
      'start live coach', "let's work out", 'lets work out', 'start',
      'resume', 'resume workout', 'resume session', 'continue workout',
      'continue session', 'carry on',
    ],
    keywords: ['start', 'begin', 'resume', 'continue', 'workout', 'session', 'training', 'exercise', 'coaching'],
    priority: 100,
    confirmation: 'Starting your session.',
    description: 'Start the Live Coach workout session',
    examples: ['start workout', 'begin session'],
  },
  {
    type: 'session.pause',
    label: 'Pause session',
    patterns: [
      'pause', 'pause workout', 'pause session', 'hold on', 'take a break',
      'pause exercise', 'wait', 'hold',
    ],
    keywords: ['pause', 'hold', 'wait', 'break', 'rest'],
    priority: 100,
    confirmation: 'Pausing. Say "resume" or "start" to continue.',
    description: 'Pause the current coaching session',
    examples: ['pause', 'take a break'],
  },
  {
    type: 'session.stop',
    label: 'Stop session',
    patterns: [
      'stop workout', 'stop session', 'stop exercise', 'end workout',
      'end session', 'finish workout', "i'm done", 'im done', 'stop coaching',
      'quit workout', 'stop',
    ],
    keywords: ['stop', 'end', 'finish', 'done', 'quit', 'workout', 'session'],
    priority: 100,
    confirmation: 'Stopping the session.',
    description: 'Stop the current coaching session',
    examples: ['stop workout', "I'm done"],
  },
  {
    type: 'session.next',
    label: 'Next exercise',
    patterns: [
      'next exercise', 'next', 'skip exercise', 'skip this', 'move on',
      'next one', 'switch exercise', 'another exercise',
    ],
    keywords: ['next', 'skip', 'switch', 'another', 'exercise'],
    priority: 100,
    confirmation: 'Moving to the next exercise.',
    description: 'Skip to the next exercise in Live Coach',
    examples: ['next exercise', 'skip this'],
  },
  {
    type: 'session.repeat',
    label: 'Repeat instruction',
    patterns: [
      'repeat that', 'repeat', 'say that again', 'what was that', 'again',
      'repeat the instruction', 'one more time', 'say again',
    ],
    keywords: ['repeat', 'again', 'instruction', 'what'],
    priority: 100,
    confirmation: 'Repeating the last instruction.',
    description: 'Hear the last coaching cue again',
    examples: ['repeat that', 'say that again'],
  },

  // Logging shortcuts
  {
    type: 'log.water',
    label: 'Log water',
    patterns: [
      'log water', 'log a glass of water', 'add water', 'drank water',
      'i drank water', 'glass of water', 'log hydration', 'hydration',
      'add a glass of water',
    ],
    keywords: ['log', 'water', 'hydration', 'drink', 'drank', 'glass'],
    priority: 80,
    confirmation: 'Opening hydration tracking so you can log a glass of water.',
    description: 'Log a glass of water (opens hydration tracker)',
    examples: ['log water', 'I drank water'],
  },
  {
    type: 'log.pain',
    label: 'Log pain',
    patterns: [
      'log pain', 'i feel pain', 'i have pain', 'pain', 'it hurts',
      'something hurts', 'i am in pain', "i'm in pain", 'record pain',
      'pain journal', 'my body hurts', 'back pain',
    ],
    keywords: ['log', 'pain', 'hurt', 'hurts', 'ache', 'sore'],
    priority: 90, // above generic navigation — safety-relevant
    confirmation:
      'Opening your pain journal. Stop exercising if anything hurts sharply.',
    description: 'Log pain in the pain journal (stops active coaching)',
    examples: ['I feel pain', 'log pain'],
  },

  // System commands
  {
    type: 'system.help',
    label: 'Voice help',
    patterns: [
      'help', 'voice help', 'what can i say', 'commands', 'voice commands',
      'show commands', 'help me', 'command list', 'what are the commands',
    ],
    keywords: ['help', 'commands', 'say', 'list', 'options'],
    priority: 95,
    confirmation: 'Here are the voice commands you can use.',
    description: 'Show and speak the list of voice commands',
    examples: ['help', 'what can I say'],
  },
  {
    type: 'system.back',
    label: 'Go back',
    patterns: [
      'go back', 'back', 'previous page', 'previous section', 'return',
      'go back to where i was', 'take me back',
    ],
    keywords: ['back', 'previous', 'return'],
    priority: 95,
    confirmation: 'Going back.',
    description: 'Return to the previous section',
    examples: ['go back', 'previous section'],
  },
  {
    type: 'system.stopListening',
    label: 'Stop listening',
    patterns: [
      'stop listening', 'stop voice', 'turn off voice', 'mic off',
      'turn off the microphone', 'stop microphone', 'disable voice',
      'stop voice control',
    ],
    keywords: ['listening', 'microphone', 'mic', 'voice', 'off'],
    priority: 95,
    confirmation: 'Voice control off.',
    description: 'Turn off the voice-command microphone',
    examples: ['stop listening', 'mic off'],
  },

  // Navigation (all existing sections kept working)
  nav('home', 'Home', 'the home screen', ['go home', 'home', 'home screen', 'main screen', 'landing'], ['home', 'main', 'landing']),
  nav('dashboard', 'Dashboard', 'your dashboard', ['go to dashboard', 'open dashboard', 'show dashboard', 'dashboard', 'my dashboard'], ['dashboard', 'overview', 'progress']),
  nav('body-scan', 'Body Scan', 'the body scan', ['body scan', 'open body scan', 'start body scan', 'scan my body', 'scan', 'motion tracking'], ['body', 'scan', 'motion', 'tracking']),
  nav('live-coach', 'Live Coach', 'the live coach', ['live coach', 'open live coach', 'rep counter', 'coach', 'form coach', 'pose tracking', 'reps'], ['live', 'coach', 'rep', 'counter', 'pose', 'form']),
  nav('exercises', 'Exercises', 'the exercise library', ['go to exercises', 'open exercises', 'show exercises', 'exercises', 'exercise library', 'library'], ['exercises', 'library', 'movements']),
  nav('adaptive-workout', 'Adaptive Workout', 'the adaptive workout builder', ['adaptive workout', 'open adaptive workout', 'workout builder', 'adaptive', 'routine', 'build a workout', 'workout plan'], ['adaptive', 'routine', 'plan', 'builder']),
  nav('mind-gym', 'Mind Gym', 'the mind gym', ['mind gym', 'open mind gym', 'mind', 'focus training', 'memory game', 'brain training', 'cognitive'], ['mind', 'gym', 'focus', 'memory', 'brain', 'cognitive']),
  nav('breathing', 'Breathing', 'breathing exercises', ['breathing', 'open breathing', 'start breathing', 'breathe', 'breathing exercise', 'breathwork'], ['breathing', 'breathe', 'breath', 'calm']),
  nav('mood', 'Mood Monitor', 'the mood monitor', ['log mood', 'open mood', 'show mood', 'mood tracker', 'mood', 'emotions', 'how i feel'], ['mood', 'emotions', 'feelings', 'feel']),
  nav('nutrition', 'Nutrition', 'nutrition', ['nutrition', 'open nutrition', 'show nutrition', 'food', 'log food', 'diet', 'meals', 'calories'], ['nutrition', 'food', 'diet', 'meal', 'calories']),
  nav('community', 'Community', 'the community', ['community', 'open community', 'show community', 'forum', 'peer support'], ['community', 'forum', 'peers']),
  nav('wearable', 'Wearable', 'wearables', ['wearable', 'open wearable', 'show wearable', 'heart rate', 'watch', 'device', 'smartwatch'], ['wearable', 'heart', 'watch', 'device']),
  nav('crisis', 'Crisis Support', 'crisis support', ['crisis', 'emergency', 'crisis support', 'i need support', 'mental health emergency', 'urgent support'], ['crisis', 'emergency', 'urgent', 'safety']),
];

/**
 * i18n seam: build a table for another locale by overriding selected fields of
 * the English defaults (e.g. translated `patterns`, `confirmation`,
 * `description`). Untouched intents fall back to English. The Pillar B locale
 * pack (src/lib/i18n) can call this without this module importing it back.
 */
export function buildIntentTable(
  overrides: Partial<Record<VoiceIntentType | SectionId, Partial<IntentDef>>> = {},
  base: IntentDef[] = INTENT_TABLE,
): IntentDef[] {
  return base.map((def) => {
    const key = def.type === 'navigate' ? def.section! : def.type;
    const patch = overrides[key];
    return patch ? { ...def, ...patch, type: def.type, section: def.section } : def;
  });
}
