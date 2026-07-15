import type { CoachingTone } from '../types';

// Tone-aware, never-shaming coaching copy. Every line is body-neutral and
// choice-led. No "push through pain", no appearance or weight references.

interface ToneVoice {
  intro: string;
  start: string;
  rest: string;
  next: string;
  complete: string;
  encouragement: string[];
}

const VOICES: Record<CoachingTone, ToneVoice> = {
  gentle: {
    intro: 'Take this at your pace. There is no rush, and every movement counts.',
    start: 'Whenever you feel ready, we can begin gently.',
    rest: 'Rest now. Breathe slowly and let your body settle.',
    next: 'When you are ready, the next movement is coming up.',
    complete: 'You moved with care today. That is something to feel good about.',
    encouragement: ['Lovely, steady work.', 'You are doing this your way.', 'Gentle and strong.'],
  },
  calm: {
    intro: 'We will move slowly and quietly. Choose what feels right for you.',
    start: 'Settle in. We can start when you are ready.',
    rest: 'Pause here. Soft breaths in and out.',
    next: 'In a moment, we move to the next one.',
    complete: 'A calm, complete session. Well done.',
    encouragement: ['Calm and steady.', 'Nice and easy.', 'You are present and moving.'],
  },
  energetic: {
    intro: 'Great to have you here. Let us bring some warm, positive energy to this.',
    start: 'Here we go — at the pace that feels good for you.',
    rest: 'Take your rest. You earned it.',
    next: 'Next movement coming right up.',
    complete: 'Fantastic effort. You showed up and moved.',
    encouragement: ['Brilliant work.', 'Love that energy.', 'You are doing great.'],
  },
  motivational: {
    intro: 'Today is about your progress, in your way. Let us build a little confidence.',
    start: 'Let us begin. Every rep is a step forward for you.',
    rest: 'Recover well. Strong choices include resting.',
    next: 'Get ready — the next movement is on its way.',
    complete: 'You followed through. That consistency is real strength.',
    encouragement: ['Proud of that effort.', 'Step by step.', 'Strength looks like this.'],
  },
  minimal: {
    intro: 'Ready when you are.',
    start: 'Begin.',
    rest: 'Rest.',
    next: 'Next up.',
    complete: 'Session complete.',
    encouragement: ['Good.', 'Done.', 'Nice.'],
  },
  simple: {
    intro: 'We will move together. Go slow. You can stop any time.',
    start: 'Let us start. Take your time.',
    rest: 'Rest now. Breathe.',
    next: 'Next move soon.',
    complete: 'All done. Good job.',
    encouragement: ['Well done.', 'Good work.', 'Nice and slow.'],
  },
  'trauma-aware': {
    intro: 'You are in control here. You can pause, change, or stop anything at any time.',
    start: 'Only if it feels right, we can begin. The choice is yours.',
    rest: 'Take all the time you need. Resting is always okay.',
    next: 'When you choose to, there is another movement ready.',
    complete: 'You stayed in choice and moved at your pace. Thank you for being here.',
    encouragement: ['You are safe to go at your pace.', 'Every choice you made was valid.', 'You are in control.'],
  },
};

export function getVoice(tone: CoachingTone): ToneVoice {
  return VOICES[tone] ?? VOICES.gentle;
}

const SAFETY_REMINDER =
  'Stop if you feel pain, dizziness, numbness, or discomfort. Choose a smaller range of motion when unsure.';

export function safetyReminder(): string {
  return SAFETY_REMINDER;
}

/** Build the spoken script for an exercise, honouring tone + simple language. */
export function buildExerciseScript(params: {
  name: string;
  startingPosition: string;
  steps: string[];
  voiceGuidance: string;
  simpleLanguage: boolean;
}): string {
  const { name, startingPosition, voiceGuidance, simpleLanguage } = params;
  if (simpleLanguage) {
    return `${name}. ${voiceGuidance}`;
  }
  return `${name}. ${startingPosition} ${voiceGuidance}`;
}

export function restAnnouncement(tone: CoachingTone, seconds: number): string {
  return `${getVoice(tone).rest} Rest for about ${seconds} seconds.`;
}

export function pickEncouragement(tone: CoachingTone, index: number): string {
  const list = getVoice(tone).encouragement;
  return list[index % list.length];
}
