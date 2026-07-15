'use client';

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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
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
} from 'recharts';
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
  color: string;
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
    color: 'emerald',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for calm focus',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'holdAfterExhale', duration: 4 },
    ],
    totalCycleDuration: 16,
    color: 'teal',
    icon: <Activity className="w-5 h-5" />,
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
    color: 'cyan',
    icon: <Wind className="w-5 h-5" />,
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
    color: 'amber',
    icon: <Flame className="w-5 h-5" />,
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
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  holdAfterExhale: 'Hold',
};

const PHASE_TTS_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdAfterExhale: 'Hold',
};

const PHASE_COLORS: Record<BreathingPhase, { bg: string; ring: string; text: string; glow: string }> = {
  inhale: {
    bg: 'bg-emerald-500/20',
    ring: 'ring-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-400/40',
  },
  hold: {
    bg: 'bg-amber-500/20',
    ring: 'ring-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-amber-400/40',
  },
  exhale: {
    bg: 'bg-cyan-500/20',
    ring: 'ring-cyan-400',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-400/40',
  },
  holdAfterExhale: {
    bg: 'bg-amber-500/20',
    ring: 'ring-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-amber-400/40',
  },
};

const PHASE_SCALE: Record<BreathingPhase, number> = {
  inhale: 1.3,
  hold: 1.3,
  exhale: 0.8,
  holdAfterExhale: 0.8,
};

// ── Pattern Color Helpers ───────────────────────────────────────────────────

const PATTERN_COLOR_MAP: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-500',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    gradient: 'from-teal-500 to-cyan-500',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500 to-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 to-orange-500',
  },
};

// ── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
  const phaseColors = PHASE_COLORS[currentPhase];

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Mindfulness & Breathing</h2>
            <p className="text-sm text-muted-foreground">Relax, restore & meditate</p>
          </div>
        </div>
        {activeTab === 'breathing' && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoiceGuidance}
            className={`rounded-full ${voiceGuidance ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : ''}`}
          >
            {voiceGuidance ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 p-1">
            <TabsTrigger value="breathing" className="gap-1.5 text-xs sm:text-sm">
              <Wind className="w-3.5 h-3.5" />
              Breathing Patterns
            </TabsTrigger>
            <TabsTrigger value="meditation" className="gap-1.5 text-xs sm:text-sm">
              <Moon className="w-3.5 h-3.5" />
              Guided Meditation
            </TabsTrigger>
          </TabsList>

          {/* Breathing Patterns Tab */}
          <TabsContent value="breathing" className="mt-6 space-y-6">
      {/* Pattern Selector */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Breathing Pattern</CardTitle>
            <CardDescription>Choose a technique that suits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BREATHING_PATTERNS.map((pattern) => {
                const colors = PATTERN_COLOR_MAP[pattern.color];
                const isSelected = selectedPattern.id === pattern.id;
                return (
                  <motion.button
                    key={pattern.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePatternChange(pattern)}
                    className={`relative p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? `${colors.bg} ${colors.border} border-2 shadow-lg`
                        : 'border-gray-200/50 dark:border-gray-700/30 hover:border-gray-300/60 dark:hover:border-gray-600/40'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="patternIndicator"
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colors.gradient} opacity-10`}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className={`flex items-center gap-2 mb-1.5 ${isSelected ? colors.text : 'text-muted-foreground'}`}>
                      {pattern.icon}
                      <span className="text-xs font-semibold">{pattern.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mb-1.5">
                      {pattern.description}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {pattern.phases.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {p.phase === 'holdAfterExhale' ? 'Hold' : p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} {p.duration}s
                        </Badge>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Breathing Circle & Controls */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {/* Duration Selector */}
              <div className="flex items-center gap-2 mb-6">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-1">Duration:</span>
                {DURATION_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selectedDuration === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (isRunning) handleReset();
                      setSelectedDuration(opt.value);
                    }}
                    className={`text-xs h-7 ${
                      selectedDuration === opt.value
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
                        : ''
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {/* Breathing Circle */}
              <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 mb-6">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: isRunning && !isPaused
                      ? `0 0 60px 15px ${currentPhase === 'inhale' ? 'rgba(16,185,129,0.3)' : currentPhase === 'exhale' ? 'rgba(6,182,212,0.3)' : 'rgba(245,158,11,0.3)'}`
                      : '0 0 0px 0px rgba(16,185,129,0)',
                  }}
                  transition={{ duration: 1 }}
                />

                {/* Background ring */}
                <div className="absolute inset-4 rounded-full bg-gray-100/50 dark:bg-gray-800/50" />

                {/* Animated breathing circle */}
                <motion.div
                  className="relative flex flex-col items-center justify-center rounded-full"
                  animate={{
                    scale: isRunning && !isPaused ? PHASE_SCALE[currentPhase] : 1,
                  }}
                  transition={{
                    duration: isRunning && !isPaused ? currentPhaseConfig?.duration || 4 : 0.5,
                    ease: currentPhase === 'inhale' ? 'easeIn' : currentPhase === 'exhale' ? 'easeOut' : 'linear',
                  }}
                  style={{ width: '85%', height: '85%' }}
                >
                  {/* Inner animated background */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      backgroundColor: isRunning && !isPaused
                        ? currentPhase === 'inhale'
                          ? 'rgba(16,185,129,0.15)'
                          : currentPhase === 'exhale'
                          ? 'rgba(6,182,212,0.15)'
                          : 'rgba(245,158,11,0.15)'
                        : 'rgba(16,185,129,0.08)',
                    }}
                    transition={{ duration: 1.5 }}
                  />

                  {/* Border ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    animate={{
                      borderColor: isRunning && !isPaused
                        ? currentPhase === 'inhale'
                          ? 'rgba(16,185,129,0.5)'
                          : currentPhase === 'exhale'
                          ? 'rgba(6,182,212,0.5)'
                          : 'rgba(245,158,11,0.5)'
                        : 'rgba(16,185,129,0.2)',
                    }}
                    transition={{ duration: 1 }}
                  />

                  {/* Phase Text */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isRunning ? currentPhase : 'idle'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 text-center"
                    >
                      {isRunning ? (
                        <>
                          <p className={`text-lg font-bold mb-1 ${phaseColors.text}`}>
                            {PHASE_LABELS[currentPhase]}
                          </p>
                          <motion.p
                            key={phaseTimeRemaining}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-bold text-foreground tabular-nums"
                          >
                            {phaseTimeRemaining}
                          </motion.p>
                        </>
                      ) : sessionComplete ? (
                        <>
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                          <p className="text-lg font-bold text-emerald-500">Session Complete!</p>
                          <p className="text-sm text-muted-foreground mt-1">{completedCycles} cycles done</p>
                        </>
                      ) : (
                        <>
                          <Wind className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-base font-semibold text-muted-foreground">Ready</p>
                          <p className="text-xs text-muted-foreground mt-1">Press play to begin</p>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Session Progress */}
              <div className="w-full max-w-sm mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{formatTime(elapsedTime)} elapsed</span>
                  <span>{formatTime(remainingTime)} remaining</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Cycles Counter */}
              <div className="flex items-center gap-2 mb-5">
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'} completed
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedPattern.name}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {!isRunning ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleStart}
                      size="lg"
                      className="rounded-full w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                    >
                      <Play className="w-6 h-6 ml-0.5" />
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handlePause}
                        size="lg"
                        variant="outline"
                        className="rounded-full w-12 h-12 border-2"
                      >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleReset}
                        size="lg"
                        variant="outline"
                        className="rounded-full w-12 h-12 border-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats & Chart Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Cards */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{todaySessions}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sessions Today</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="text-center p-3 rounded-xl bg-teal-500/10 border border-teal-500/20"
              >
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{totalMinutesToday}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Minutes Today</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="text-center p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
              >
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{streakDays}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Day Streak 🔥</p>
              </motion.div>
            </div>

            {/* Weekly Chart */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                Weekly Breathing Minutes
              </p>
              <div className="h-40">
                <AreaChart
                  width={undefined}
                  height={160}
                  data={weeklyBreathingData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="breathGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.4)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#breathGradient)"
                  />
                </AreaChart>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {mockSessionHistory.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    session.completed
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {session.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.pattern}</p>
                    <p className="text-xs text-muted-foreground">{session.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {session.duration} min
                    </Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 backdrop-blur-xl border-emerald-500/20 dark:border-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Breathing Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Sit comfortably with your back straight and shoulders relaxed</li>
                  <li>• Breathe through your nose when possible for better airflow</li>
                  <li>• Start with shorter sessions and gradually increase duration</li>
                  <li>• 4-7-8 technique is especially helpful for falling asleep</li>
                  <li>• Box breathing is great for managing acute stress and anxiety</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

          </TabsContent>

          {/* Guided Meditation Tab */}
          <TabsContent value="meditation" className="mt-6">
            <MeditationTimer />
          </TabsContent>
        </Tabs>
      </motion.div>

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
    </motion.div>
  );
}
