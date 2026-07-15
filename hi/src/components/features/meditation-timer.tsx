'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  TreePine,
  Moon,
  Clock,
  Sparkles,
  Heart,
  Brain,
  Leaf,
  Feather,
  CheckCircle2,
  RotateCcw,
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
import { Slider } from '@/components/ui/slider';

// ── Types ────────────────────────────────────────────────────────────────────

type MeditationState = 'idle' | 'running' | 'paused' | 'completed';
type BreathingPhase = 'inhale' | 'hold' | 'exhale';
type AmbientSound = 'rain' | 'ocean' | 'forest' | 'silence';
type SpeedOption = 1 | 1.5 | 2;

interface MeditationPreset {
  id: string;
  name: string;
  duration: number; // seconds
  breathing: { inhale: number; hold: number; exhale: number };
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}

// ── Meditation Presets ───────────────────────────────────────────────────────

const MEDITATION_PRESETS: MeditationPreset[] = [
  {
    id: 'quick-calm',
    name: 'Quick Calm',
    duration: 300, // 5 min
    breathing: { inhale: 4, hold: 4, exhale: 6 },
    icon: <Feather className="w-5 h-5" />,
    description: 'A quick reset for your mind and body',
    color: 'emerald',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'deep-relaxation',
    name: 'Deep Relaxation',
    duration: 600, // 10 min
    breathing: { inhale: 4, hold: 7, exhale: 8 },
    icon: <Moon className="w-5 h-5" />,
    description: 'Profound relaxation with 4-7-8 breathing',
    color: 'teal',
    gradient: 'from-teal-400 to-emerald-500',
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    duration: 900, // 15 min
    breathing: { inhale: 5, hold: 5, exhale: 5 },
    icon: <Brain className="w-5 h-5" />,
    description: 'Mindful body awareness meditation',
    color: 'cyan',
    gradient: 'from-cyan-400 to-teal-500',
  },
  {
    id: 'extended-peace',
    name: 'Extended Peace',
    duration: 1200, // 20 min
    breathing: { inhale: 6, hold: 6, exhale: 6 },
    icon: <Leaf className="w-5 h-5" />,
    description: 'Deep extended meditation for inner peace',
    color: 'amber',
    gradient: 'from-amber-400 to-emerald-500',
  },
];

// ── Ambient Sounds Config ────────────────────────────────────────────────────

const AMBIENT_SOUNDS: { id: AmbientSound; label: string; icon: React.ReactNode }[] = [
  { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
  { id: 'ocean', label: 'Ocean', icon: <Waves className="w-4 h-4" /> },
  { id: 'forest', label: 'Forest', icon: <TreePine className="w-4 h-4" /> },
  { id: 'silence', label: 'Silence', icon: <Moon className="w-4 h-4" /> },
];

// ── Speed Options ────────────────────────────────────────────────────────────

const SPEED_OPTIONS: { value: SpeedOption; label: string }[] = [
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

// ── Phase Colors ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<BreathingPhase, { stroke: string; glow: string; text: string; bg: string }> = {
  inhale: {
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  hold: {
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-400',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  exhale: {
    stroke: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.4)',
    text: 'text-teal-400',
    bg: 'rgba(20, 184, 166, 0.15)',
  },
};

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
};

// ── Preset Color Map ─────────────────────────────────────────────────────────

const PRESET_COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    glow: 'shadow-teal-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
};

// ── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Format helpers ───────────────────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

// ── Completion Messages ──────────────────────────────────────────────────────

const COMPLETION_MESSAGES = [
  'You found your center. Beautiful work. 🧘',
  'Stillness is a superpower. Well done. ✨',
  'Your mind thanks you for this moment. 🌿',
  'Peace flows through you. Namaste. 🕊️',
  'You invested in yourself. That matters. 💎',
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function MeditationTimer() {
  // State
  const [meditationState, setMeditationState] = useState<MeditationState>('idle');
  const [selectedPreset, setSelectedPreset] = useState<MeditationPreset>(MEDITATION_PRESETS[0]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Breathing phase state
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  // Settings
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('silence');

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Completion message (initialized lazily)
  const [completionMessage, setCompletionMessage] = useState(() =>
    COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
  );

  // Derived
  const totalDuration = selectedPreset.duration;
  const progressPercent = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0;
  const phaseColors = PHASE_COLORS[currentPhase];
  const cycleDuration =
    selectedPreset.breathing.inhale + selectedPreset.breathing.hold + selectedPreset.breathing.exhale;

  // ── Breathing Phase Logic ──────────────────────────────────────────────

  const currentPhaseDuration = useMemo(() => {
    return selectedPreset.breathing[currentPhase];
  }, [selectedPreset, currentPhase]);

  const advancePhase = useCallback(() => {
    setCurrentPhase((prev) => {
      if (prev === 'inhale') return 'hold';
      if (prev === 'hold') {
        setCompletedCycles((c) => c + 1);
        return 'exhale';
      }
      return 'inhale';
    });
    setPhaseElapsed(0);
  }, []);

  // ── Timer Logic ────────────────────────────────────────────────────────

  useEffect(() => {
    if (meditationState !== 'running') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.max(50, Math.round(1000 / speed));

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + intervalMs / 1000;
        if (next >= totalDuration) {
          setMeditationState('completed');
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return totalDuration;
        }
        return next;
      });

      setRemainingTime((prev) => {
        const next = prev - intervalMs / 1000;
        return Math.max(0, next);
      });

      setPhaseElapsed((prev) => {
        const next = prev + intervalMs / 1000;
        if (next >= currentPhaseDuration) {
          advancePhase();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [meditationState, speed, totalDuration, currentPhaseDuration, advancePhase]);

  // ── Controls ───────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setSelectedPreset((prev) => {
      setRemainingTime(prev.duration);
      setElapsedTime(0);
      setCompletedCycles(0);
      setCurrentPhase('inhale');
      setPhaseElapsed(0);
      return prev;
    });
    setMeditationState('running');
  }, []);

  const handlePause = useCallback(() => {
    setMeditationState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setMeditationState('running');
  }, []);

  const handleStop = useCallback(() => {
    setMeditationState('idle');
    setElapsedTime(0);
    setRemainingTime(selectedPreset.duration);
    setCompletedCycles(0);
    setCurrentPhase('inhale');
    setPhaseElapsed(0);
  }, [selectedPreset.duration]);

  const handlePresetChange = useCallback((preset: MeditationPreset) => {
    if (meditationState !== 'idle') {
      setMeditationState('idle');
    }
    setSelectedPreset(preset);
    setRemainingTime(preset.duration);
    setElapsedTime(0);
    setCompletedCycles(0);
    setCurrentPhase('inhale');
    setPhaseElapsed(0);
  }, [meditationState]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // ── SVG Breathing Ring ─────────────────────────────────────────────────

  const ringRadius = 120;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset = ringCircumference * (1 - progressPercent / 100);

  // Breathing ring scale based on phase
  const breathScale = useMemo(() => {
    if (meditationState !== 'running') return 1;
    const progress = Math.min(phaseElapsed / currentPhaseDuration, 1);
    if (currentPhase === 'inhale') {
      return 0.85 + 0.15 * progress; // expand from 0.85 to 1.0
    } else if (currentPhase === 'exhale') {
      return 1.0 - 0.15 * progress; // contract from 1.0 to 0.85
    }
    return 1.0; // hold
  }, [meditationState, phaseElapsed, currentPhaseDuration, currentPhase]);

  // ── Render: Idle State ─────────────────────────────────────────────────

  const renderIdleState = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Preset Selection */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Meditation Presets
            </CardTitle>
            <CardDescription>Choose a guided meditation session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEDITATION_PRESETS.map((preset) => {
                const colors = PRESET_COLOR_MAP[preset.color];
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePresetChange(preset)}
                    className={`relative p-4 rounded-xl border text-left transition-all overflow-hidden ${
                      isSelected
                        ? `${colors.bg} ${colors.border} border-2 shadow-lg ${colors.glow}`
                        : 'border-gray-200/50 dark:border-gray-700/30 hover:border-gray-300/60 dark:hover:border-gray-600/40 bg-white/40 dark:bg-gray-900/40 hover:shadow-md hover:shadow-emerald-500/5'
                    }`}
                    style={{
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="meditationPresetIndicator"
                        className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} opacity-10`}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className={`relative z-10`}>
                      <div className={`flex items-center gap-2 mb-2 ${isSelected ? colors.text : 'text-muted-foreground'}`}>
                        {preset.icon}
                        <span className="text-sm font-semibold">{preset.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {preset.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          {formatDuration(preset.duration)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {preset.breathing.inhale}-{preset.breathing.hold}-{preset.breathing.exhale}
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ambient Sound & Settings */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Ambient Sounds */}
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Ambient Sound
                </p>
                <div className="flex gap-2">
                  {AMBIENT_SOUNDS.map((sound) => (
                    <motion.button
                      key={sound.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAmbientSound(sound.id)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all ${
                        ambientSound === sound.id
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-100/50 dark:bg-gray-800/50 text-muted-foreground border border-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {sound.icon}
                      <span>{sound.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Volume & Speed */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      Volume
                    </span>
                    <span className="text-[10px]">{isMuted ? 'Muted' : `${volume}%`}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(val) => {
                        setVolume(val[0]);
                        if (val[0] > 0) setIsMuted(false);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Speed</p>
                  <div className="flex gap-1.5">
                    {SPEED_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={speed === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSpeed(opt.value)}
                        className={`text-xs h-7 px-3 ${
                          speed === opt.value
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
                            : ''
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Start Button */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleStart}
            size="lg"
            className="rounded-full px-8 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 text-base font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Begin Meditation
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // ── Render: Active Timer ───────────────────────────────────────────────

  const renderActiveTimer = () => {
    const isActive = meditationState === 'running';
    const phaseProgress = currentPhaseDuration > 0 ? phaseElapsed / currentPhaseDuration : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* Meditation Mode Background */}
        <div className={`w-full -mx-6 -mt-6 mb-6 px-6 pt-6 pb-4 rounded-t-xl transition-all duration-1000 ${
          isActive && currentPhase === 'inhale' ? 'meditation-phase-inhale' :
          isActive && currentPhase === 'hold' ? 'meditation-phase-hold' :
          isActive && currentPhase === 'exhale' ? 'meditation-phase-exhale' :
          'bg-gradient-to-b from-emerald-950/80 via-teal-950/60 to-transparent dark:from-emerald-950/90 dark:via-teal-950/70 dark:to-transparent'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-[10px] bg-emerald-900/30 border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {selectedPreset.name}
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-emerald-900/30 border-emerald-500/30 text-emerald-300">
              {formatDuration(totalDuration)}
            </Badge>
          </div>
        </div>

        {/* Breathing Ring SVG */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mb-6">
          {/* Outer pulsing glow */}
          <motion.div
            className={`absolute inset-0 rounded-full ${isActive ? 'meditation-glow' : ''}`}
            animate={{
              boxShadow: isActive
                ? `0 0 ${40 + phaseProgress * 30}px ${10 + phaseProgress * 15}px ${phaseColors.glow}`
                : '0 0 20px 5px rgba(16, 185, 129, 0.1)',
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          <motion.svg
            width="100%"
            height="100%"
            viewBox="0 0 280 280"
            className="absolute"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r={ringRadius}
              fill="none"
              stroke="rgba(128, 128, 128, 0.1)"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <motion.circle
              cx="140"
              cy="140"
              r={ringRadius}
              fill="none"
              stroke="url(#meditationGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringStrokeDashoffset}
              initial={false}
              animate={{
                strokeDashoffset: ringStrokeDashoffset,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="meditationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Breathing animated circle */}
          <motion.div
            className="relative flex flex-col items-center justify-center rounded-full"
            animate={{
              scale: breathScale,
            }}
            transition={{
              duration: isActive ? currentPhaseDuration / speed : 0.5,
              ease: currentPhase === 'inhale' ? 'easeInOut' : currentPhase === 'exhale' ? 'easeInOut' : 'linear',
            }}
            style={{ width: '78%', height: '78%' }}
          >
            {/* Inner background */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                backgroundColor: isActive ? phaseColors.bg : 'rgba(16, 185, 129, 0.08)',
              }}
              transition={{ duration: 1 }}
            />
            {/* Inner border */}
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              animate={{
                borderColor: isActive ? `${phaseColors.stroke}50` : 'rgba(16, 185, 129, 0.15)',
              }}
              transition={{ duration: 0.8 }}
            />

            {/* Center content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isActive ? currentPhase : 'paused'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 text-center"
              >
                {isActive ? (
                  <>
                    <p className={`text-base sm:text-lg font-bold mb-1 ${phaseColors.text}`}>
                      {PHASE_LABELS[currentPhase]}
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">
                      {formatTimer(remainingTime)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">
                      {formatTimer(remainingTime)}
                    </p>
                    <p className="text-sm font-medium text-amber-400 mt-2">Paused</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Phase Progress Bars */}
        <div className="w-full max-w-xs mb-5">
          <div className="flex items-center gap-1 mb-1.5">
            {(['inhale', 'hold', 'exhale'] as BreathingPhase[]).map((phase) => {
              const phaseDur = selectedPreset.breathing[phase];
              const phasePct = cycleDuration > 0 ? (phaseDur / cycleDuration) * 100 : 0;
              const isCurrentPhase = currentPhase === phase && isActive;
              return (
                <div key={phase} className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${isCurrentPhase ? phaseColors.text : 'text-muted-foreground'}`}>
                      {PHASE_LABELS[phase]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{phaseDur}s</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        phase === 'inhale'
                          ? 'bg-emerald-500'
                          : phase === 'hold'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      animate={{
                        width: isCurrentPhase ? `${phaseProgress * 100}%` : currentPhase === phase ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          {meditationState === 'running' ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handlePause}
                size="lg"
                variant="outline"
                className="rounded-full w-14 h-14 sm:w-16 sm:h-16 border-2 border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                <Pause className="w-6 h-6 text-amber-500" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleResume}
                size="lg"
                className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
              >
                <Play className="w-6 h-6 ml-0.5" />
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleStop}
              size="lg"
              variant="outline"
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 border-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Square className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Active Settings (faded) */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="flex items-center gap-3 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              {AMBIENT_SOUNDS.find((s) => s.id === ambientSound)?.icon}
              {AMBIENT_SOUNDS.find((s) => s.id === ambientSound)?.label}
            </span>
            <span>•</span>
            <span>{speed}x speed</span>
            <span>•</span>
            <span>{isMuted ? 'Muted' : `${volume}%`}</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  };

  // ── Render: Completed State ────────────────────────────────────────────

  const renderCompletedState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center text-center celebration-bg rounded-xl py-4"
    >
      {/* Completion animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border-2 border-emerald-500/30">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
      </motion.div>

      {/* Completion Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="text-2xl font-bold text-foreground mb-2">Meditation Complete</h3>
        <p className="text-base text-muted-foreground mb-6 max-w-xs">
          {completionMessage}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-2 gap-4 mb-8 w-full max-w-sm"
      >
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatTimer(elapsedTime)}
          </p>
          <p className="text-[11px] text-muted-foreground">Duration</p>
        </div>
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
          <Sparkles className="w-5 h-5 text-teal-500 mx-auto mb-1.5" />
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
            {completedCycles}
          </p>
          <p className="text-[11px] text-muted-foreground">Breathing Cycles</p>
        </div>
      </motion.div>

      {/* Preset Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            {selectedPreset.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {selectedPreset.breathing.inhale}-{selectedPreset.breathing.hold}-{selectedPreset.breathing.exhale} breathing
          </Badge>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={() => {
              setCompletionMessage(
                COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
              );
              handleStart();
            }}
            className="bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Meditate Again
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            onClick={handleStop}
            className="border-emerald-500/30"
          >
            <Heart className="w-4 h-4 mr-2 text-emerald-500" />
            Log Session
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // ── Main Render ────────────────────────────────────────────────────────

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
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Guided Meditation</h2>
            <p className="text-sm text-muted-foreground">Timer with breathing guidance</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={itemVariants}>
        <Card
          className={`overflow-hidden transition-all duration-700 ${
            meditationState === 'running'
              ? 'bg-gradient-to-b from-emerald-950/30 via-gray-900/60 to-white/60 dark:from-emerald-950/40 dark:via-gray-900/70 dark:to-gray-900/60 border-emerald-500/20'
              : meditationState === 'paused'
              ? 'bg-gradient-to-b from-amber-950/20 via-gray-900/40 to-white/60 dark:from-amber-950/30 dark:via-gray-900/50 dark:to-gray-900/60 border-amber-500/20'
              : meditationState === 'completed'
              ? 'bg-gradient-to-b from-emerald-950/20 via-gray-900/40 to-white/60 dark:from-emerald-950/30 dark:via-gray-900/50 dark:to-gray-900/60 border-emerald-500/20'
              : 'bg-white/60 dark:bg-gray-900/60 border-white/20 dark:border-gray-700/30'
          } backdrop-blur-xl`}
        >
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {meditationState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {renderIdleState()}
                </motion.div>
              )}

              {(meditationState === 'running' || meditationState === 'paused') && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {renderActiveTimer()}
                </motion.div>
              )}

              {meditationState === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {renderCompletedState()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips Section */}
      {meditationState === 'idle' && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 backdrop-blur-xl border-emerald-500/20 dark:border-emerald-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Meditation Tips</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Find a quiet, comfortable space where you won&apos;t be disturbed</li>
                    <li>• Close your eyes and focus on the rhythm of your breath</li>
                    <li>• Let thoughts pass without judgment — return to your breath</li>
                    <li>• Start with shorter sessions and gradually extend your practice</li>
                    <li>• Consistency matters more than duration — meditate daily</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
