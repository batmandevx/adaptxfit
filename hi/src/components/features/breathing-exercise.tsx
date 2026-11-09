'use client';

/**
 * Breathing & Mindfulness (features.md — breathing).
 *
 * A calm, centered breathing stage: one large circle with a 10px phase-tinted
 * border, 32px phase label + mono countdown, preset chips, and generous
 * controls. Reduced motion: the circle never scales — only the border color
 * changes and a linear phase-progress bar is shown.
 *
 * All timer / phase / TTS guidance logic is unchanged from v1.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Activity,
  Heart,
  Flame,
  Clock,
  Trophy,
  Calendar,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  GlassPanel,
  SectionHeader,
  StatTile,
  useReduced,
  EASE,
  DURATION,
} from '@/components/ui/aurora';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/use-tts';
import { useAppStore } from '@/stores/app-store';
import MeditationTimer from '@/components/features/meditation-timer';

// ── Breathing Pattern Types ─────────────────────────────────────────────────

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: { phase: BreathingPhase; duration: number }[];
  totalCycleDuration: number;
  tone: 'primary' | 'secondary' | 'info' | 'warning';
  icon: React.ReactNode;
}

// ── Breathing Patterns ──────────────────────────────────────────────────────

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Relaxation',
    description: 'Deep relaxation technique for stress relief',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 7 },
      { phase: 'exhale', duration: 8 },
    ],
    totalCycleDuration: 19,
    tone: 'primary',
    icon: <Heart className="h-5 w-5" />,
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Steady four-part rhythm for calm focus',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'holdAfterExhale', duration: 4 },
    ],
    totalCycleDuration: 16,
    tone: 'secondary',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Balance your nervous system',
    phases: [
      { phase: 'inhale', duration: 5 },
      { phase: 'exhale', duration: 5 },
    ],
    totalCycleDuration: 10,
    tone: 'info',
    icon: <Wind className="h-5 w-5" />,
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    description: 'Quick pace to boost energy',
    phases: [
      { phase: 'inhale', duration: 2 },
      { phase: 'exhale', duration: 2 },
    ],
    totalCycleDuration: 4,
    tone: 'warning',
    icon: <Flame className="h-5 w-5" />,
  },
];

// ── Mock Data ───────────────────────────────────────────────────────────────

const weeklyBreathingData = [
  { day: 'Mon', minutes: 8 },
  { day: 'Tue', minutes: 12 },
  { day: 'Wed', minutes: 5 },
  { day: 'Thu', minutes: 15 },
  { day: 'Fri', minutes: 10 },
  { day: 'Sat', minutes: 20 },
  { day: 'Sun', minutes: 14 },
];

const mockSessionHistory = [
  { id: 1, pattern: '4-7-8 Relaxation', duration: 5, date: 'Today, 9:30 AM', completed: true },
  { id: 2, pattern: 'Box Breathing', duration: 10, date: 'Today, 7:15 AM', completed: true },
  { id: 3, pattern: 'Coherent Breathing', duration: 5, date: 'Yesterday, 8:00 PM', completed: true },
  { id: 4, pattern: '4-7-8 Relaxation', duration: 15, date: 'Yesterday, 6:30 AM', completed: true },
  { id: 5, pattern: 'Energizing Breath', duration: 2, date: '2 days ago, 12:00 PM', completed: true },
  { id: 6, pattern: 'Box Breathing', duration: 5, date: '2 days ago, 7:00 AM', completed: false },
];

// ── Duration Options ────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
];

// ── Phase Helpers ───────────────────────────────────────────────────────────

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdAfterExhale: 'Hold',
};

const PHASE_TTS_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdAfterExhale: 'Hold',
};

/** Phase → Clinical Aurora token classes (border, text, soft fill). */
const PHASE_TOKENS: Record<BreathingPhase, { border: string; text: string; soft: string }> = {
  inhale: { border: 'border-primary', text: 'text-primary', soft: 'bg-primary-soft/60' },
  hold: { border: 'border-warning', text: 'text-warning', soft: 'bg-warning-soft/60' },
  exhale: { border: 'border-secondary', text: 'text-secondary', soft: 'bg-secondary-soft/60' },
  holdAfterExhale: { border: 'border-warning', text: 'text-warning', soft: 'bg-warning-soft/60' },
};

const TONE_CAPSULE: Record<BreathingPattern['tone'], string> = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
};

const PHASE_SCALE: Record<BreathingPhase, number> = {
  inhale: 1.25,
  hold: 1.25,
  exhale: 0.85,
  holdAfterExhale: 0.85,
};

// ── Format helpers ──────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function BreathingExercise() {
  const { speak, stop: stopTTS, isPlaying: ttsPlaying } = useTTS({
    voice: 'tongtong',
    speed: 0.8,
  });
  const appStore = useAppStore();
  const reduced = useReduced();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('breathing');

  // Session state
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(300); // 5 min default
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Phase state
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');

  // Voice guidance
  const [voiceGuidance, setVoiceGuidance] = useState(true);

  // Session completion
  const [sessionComplete, setSessionComplete] = useState(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnnouncedPhase = useRef<BreathingPhase | null>(null);

  // Derived
  const remainingTime = Math.max(0, selectedDuration - elapsedTime);
  const progressPercent = Math.min((elapsedTime / selectedDuration) * 100, 100);
  const currentPhaseConfig = selectedPattern.phases[currentPhaseIndex];
  const phaseTokens = PHASE_TOKENS[currentPhase];
  const phaseDuration = currentPhaseConfig?.duration || 1;
  const phaseProgress = isRunning
    ? Math.min(100, ((phaseDuration - phaseTimeRemaining) / phaseDuration) * 100)
    : 0;

  // Mock stats
  const todaySessions = 2;
  const totalMinutesToday = 15;
  const streakDays = 7;

  // ── Timer Logic ─────────────────────────────────────────────────────────

  const advancePhase = useCallback(() => {
    const nextIndex = (currentPhaseIndex + 1) % selectedPattern.phases.length;
    if (nextIndex === 0) {
      setCompletedCycles((prev) => prev + 1);
    }
    setCurrentPhaseIndex(nextIndex);
    const nextPhase = selectedPattern.phases[nextIndex];
    setCurrentPhase(nextPhase.phase);
    setPhaseTimeRemaining(nextPhase.duration);
  }, [currentPhaseIndex, selectedPattern]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev + 1 >= selectedDuration) {
          setIsRunning(false);
          setSessionComplete(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return selectedDuration;
        }
        return prev + 1;
      });

      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Phase complete - advance
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isPaused, selectedDuration, advancePhase]);

  // ── TTS Announcement ────────────────────────────────────────────────────

  useEffect(() => {
    if (voiceGuidance && isRunning && !isPaused && currentPhase !== lastAnnouncedPhase.current) {
      lastAnnouncedPhase.current = currentPhase;
      speak(PHASE_TTS_LABELS[currentPhase], { voice: 'tongtong', speed: 0.8 });
    }
  }, [currentPhase, voiceGuidance, isRunning, isPaused, speak]);

  // ── Controls ────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    const firstPhase = selectedPattern.phases[0];
    setCurrentPhaseIndex(0);
    setCurrentPhase(firstPhase.phase);
    setPhaseTimeRemaining(firstPhase.duration);
    setElapsedTime(0);
    setCompletedCycles(0);
    setSessionComplete(false);
    lastAnnouncedPhase.current = null;
    setIsPaused(false);
    setIsRunning(true);
  }, [selectedPattern]);

  const handlePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setCompletedCycles(0);
    setCurrentPhaseIndex(0);
    setCurrentPhase('inhale');
    setPhaseTimeRemaining(selectedPattern.phases[0].duration);
    setSessionComplete(false);
    lastAnnouncedPhase.current = null;
    stopTTS();
  }, [selectedPattern, stopTTS]);

  const handlePatternChange = useCallback((pattern: BreathingPattern) => {
    if (isRunning) {
      handleReset();
    }
    setSelectedPattern(pattern);
    setCurrentPhaseIndex(0);
    setCurrentPhase(pattern.phases[0].phase);
    setPhaseTimeRemaining(pattern.phases[0].duration);
  }, [isRunning, handleReset]);

  const toggleVoiceGuidance = useCallback(() => {
    setVoiceGuidance((prev) => {
      if (prev) stopTTS();
      return !prev;
    });
  }, [stopTTS]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-6">
      <SectionHeader
        eyebrow="BREATHING"
        title="Find a steadier rhythm."
        description="Guided breathing and meditation, paced gently. Follow the circle — or close your eyes and listen."
        actions={
          activeTab === 'breathing' ? (
            <Button
              variant="outline"
              onClick={toggleVoiceGuidance}
              className={cn(
                'h-12 gap-2 rounded-[14px] px-4',
                voiceGuidance && 'border-primary/40 bg-primary-soft text-primary',
              )}
              aria-pressed={voiceGuidance}
              aria-label={voiceGuidance ? 'Turn voice guidance off' : 'Turn voice guidance on'}
            >
              {voiceGuidance ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">Voice guidance</span>
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-panel h-12 w-full p-1 sm:w-auto">
          <TabsTrigger value="breathing" className="h-10 gap-1.5 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary sm:text-sm">
            <Wind className="h-3.5 w-3.5" />
            Breathing Patterns
          </TabsTrigger>
          <TabsTrigger value="meditation" className="h-10 gap-1.5 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary sm:text-sm">
            <Moon className="h-3.5 w-3.5" />
            Guided Meditation
          </TabsTrigger>
        </TabsList>

        {/* Breathing Patterns Tab */}
        <TabsContent value="breathing" className="mt-6 space-y-6">
          {/* Pattern preset chips */}
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Breathing pattern">
            {BREATHING_PATTERNS.map((pattern) => {
              const isSelected = selectedPattern.id === pattern.id;
              return (
                <button
                  key={pattern.id}
                  onClick={() => handlePatternChange(pattern)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-h-12 items-center gap-2.5 rounded-full border px-4 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                    isSelected
                      ? 'border-primary/50 bg-primary-soft'
                      : 'border-border/60 bg-surface/70 hover:border-primary/30 hover:bg-primary-soft/50',
                  )}
                >
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', TONE_CAPSULE[pattern.tone])}>
                    {pattern.icon}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold text-foreground">{pattern.name}</span>
                    <span className="block text-xs text-foreground-subtle">
                      {pattern.phases.map((p) => `${PHASE_LABELS[p.phase].split(' ').pop()} ${p.duration}s`).join(' · ')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Breathing stage */}
          <GlassPanel radius="2xl" className="flex min-h-[520px] flex-col items-center justify-center p-6 sm:p-8">
            {/* Duration chips */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Session duration">
              <Timer className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (isRunning) handleReset();
                    setSelectedDuration(opt.value);
                  }}
                  aria-pressed={selectedDuration === opt.value}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-150',
                    selectedDuration === opt.value
                      ? 'border-primary/50 bg-primary-soft text-primary'
                      : 'border-border/60 text-foreground-muted hover:bg-surface-raised',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Circle */}
            <div className="relative mb-6 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
              {/* Soft phase glow */}
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 rounded-full transition-colors duration-1000',
                  isRunning && !isPaused ? phaseTokens.soft : 'bg-surface-raised/50',
                )}
                style={
                  isRunning && !isPaused && !reduced
                    ? { boxShadow: 'var(--shadow-glow-primary)' }
                    : undefined
                }
              />

              {/* Animated breathing circle — 10px border; never scales under reduced motion */}
              <motion.div
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-full border-[10px] bg-surface/80 transition-colors duration-1000',
                  isRunning && !isPaused ? phaseTokens.border : 'border-border',
                )}
                animate={{
                  scale: !reduced && isRunning && !isPaused ? PHASE_SCALE[currentPhase] : 1,
                }}
                transition={{
                  duration: !reduced && isRunning && !isPaused ? phaseDuration : 0.5,
                  ease: currentPhase === 'inhale' ? 'easeIn' : currentPhase === 'exhale' ? 'easeOut' : 'linear',
                }}
                style={{ width: '82%', height: '82%' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isRunning ? currentPhase : sessionComplete ? 'done' : 'idle'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0.14 : 0.3 }}
                    className="relative z-10 text-center"
                  >
                    {isRunning ? (
                      <>
                        <p className={cn('font-display text-[32px] font-semibold leading-tight', phaseTokens.text)}>
                          {PHASE_LABELS[currentPhase]}
                        </p>
                        <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-foreground">
                          {phaseTimeRemaining}
                        </p>
                      </>
                    ) : sessionComplete ? (
                      <>
                        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-success" />
                        <p className="font-display text-lg font-semibold text-success">Session complete</p>
                        <p className="mt-1 text-sm text-foreground-muted">{completedCycles} cycles done</p>
                      </>
                    ) : (
                      <>
                        <Wind className="mx-auto mb-2 h-8 w-8 text-primary" />
                        <p className="font-display text-base font-semibold text-foreground-muted">Ready when you are</p>
                        <p className="mt-1 text-xs text-foreground-subtle">Press begin to start</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Reduced-motion phase progress: linear bar instead of a scaling circle */}
            {reduced && isRunning && (
              <div className="mb-4 w-full max-w-sm">
                <div className="mb-1.5 flex justify-between text-xs text-foreground-subtle">
                  <span>{PHASE_LABELS[currentPhase]}</span>
                  <span>{phaseTimeRemaining}s</span>
                </div>
                <Progress value={phaseProgress} className="h-2" />
              </div>
            )}

            {/* Session progress */}
            <div className="mb-4 w-full max-w-sm">
              <div className="mb-1.5 flex justify-between text-xs text-foreground-subtle">
                <span>{formatTime(elapsedTime)} elapsed</span>
                <span>{formatTime(remainingTime)} remaining</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Cycles + pattern badges */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'} completed
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {selectedPattern.name}
              </Badge>
              {ttsPlaying && (
                <Badge variant="outline" className="gap-1 text-xs text-primary">
                  <Volume2 className="h-3 w-3" />
                  Speaking
                </Badge>
              )}
            </div>

            {/* Controls — 48px+ targets */}
            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  className="btn-aurora-primary h-14 gap-2 rounded-full px-8 text-[15px] font-semibold"
                  aria-label="Begin breathing session"
                >
                  <Play className="h-5 w-5" /> Begin
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="h-[52px] gap-2 rounded-full border-2 px-6"
                    aria-label={isPaused ? 'Resume breathing session' : 'Pause breathing session'}
                    aria-pressed={isPaused}
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="icon"
                    className="h-[52px] w-[52px] rounded-full border-2 text-danger hover:bg-danger-soft"
                    aria-label="Reset breathing session"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </GlassPanel>

          {/* Stats row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              icon={<Trophy className="h-5 w-5" />}
              tone="primary"
              label="Sessions today"
              value={todaySessions}
              delta="Gentle pace"
              deltaTone="primary"
            />
            <StatTile
              icon={<Timer className="h-5 w-5" />}
              tone="secondary"
              label="Minutes today"
              value={totalMinutesToday}
              delta="+3 vs yesterday"
              deltaTone="secondary"
            />
            <StatTile
              icon={<Flame className="h-5 w-5" />}
              tone="warning"
              label="Day streak"
              value={streakDays}
              delta="No pressure"
              deltaTone="warning"
            />
          </div>

          {/* Chart + history */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GlassPanel className="p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-secondary" />
                Weekly breathing minutes
              </h3>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyBreathingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="breathGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0E7A5C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0E7A5C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.4)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.4)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-overlay)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#0E7A5C"
                      strokeWidth={2}
                      fill="url(#breathGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-secondary" />
                Recent sessions
              </h3>
              <div className="custom-scrollbar mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {mockSessionHistory.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: reduced ? 0 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduced ? 0 : index * 0.05, duration: reduced ? 0.14 : DURATION.standard, ease: EASE.careOut }}
                    className="group flex items-center gap-3 rounded-[14px] p-2.5 transition-colors hover:bg-surface-raised"
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      session.completed ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
                    )}>
                      {session.completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{session.pattern}</p>
                      <p className="text-xs text-foreground-subtle">{session.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session.duration} min
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Tips */}
          <GlassPanel className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-foreground">Breathing tips</p>
                <ul className="space-y-1 text-xs leading-5 text-foreground-muted">
                  <li>• Sit comfortably with your back straight and shoulders relaxed</li>
                  <li>• Breathe through your nose when possible for better airflow</li>
                  <li>• Start with shorter sessions and gradually increase duration</li>
                  <li>• 4-7-8 technique is especially helpful for falling asleep</li>
                  <li>• Box breathing is great for managing acute stress and anxiety</li>
                </ul>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>

        {/* Guided Meditation Tab */}
        <TabsContent value="meditation" className="mt-6">
          <MeditationTimer />
        </TabsContent>
      </Tabs>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(128, 128, 128, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(128, 128, 128, 0.5);
        }
      `}</style>
    </div>
  );
}
