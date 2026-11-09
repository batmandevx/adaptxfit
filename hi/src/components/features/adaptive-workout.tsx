'use client';

/**
 * Adaptive Workout — Clinical Aurora redesign (design/features.md §4).
 *
 * Session player built on the existing deterministic adaptive-gym engine
 * (src/lib/adaptive-gym/, unchanged): persona/default profile → Smart
 * Exclusion + Safety Validated routine. Layout per spec: session overview +
 * exercise timeline (left, 4 cols), current-exercise player (right, 8 cols),
 * make-it-easier menu, regeneration toolbar, and a completion state.
 *
 * Behavior preserved: generateWorkout / replaceExercise / applyRegeneration
 * contracts, persona loading, and toast announcements.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accessibility,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  Timer,
  Dumbbell,
  Armchair,
  ArrowLeft,
  HeartHandshake,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Circle,
  Info,
  Check,
  Wind,
  LayoutDashboard,
} from 'lucide-react';
import {
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
  SPRING,
  staggerContainer,
  staggerItem,
  reducedItem,
} from '@/components/ui/aurora';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToastStore } from '@/components/features/toast-provider';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

import type {
  AbilityProfile,
  RegenerationMode,
  ReplacementReason,
  Workout,
} from '@/lib/adaptive-gym/types';
import {
  generateWorkout,
  replaceExercise,
  applyRegeneration,
} from '@/lib/adaptive-gym/engine/workoutGenerator';
import { DEMO_PERSONAS, personaById } from '@/lib/adaptive-gym/data/demoPersonas';
import { createDefaultProfile } from '@/lib/adaptive-gym/data/defaults';

const REPLACEMENT_REASONS: { value: ReplacementReason; label: string }[] = [
  { value: 'too-hard', label: 'Too hard for me' },
  { value: 'too-easy', label: 'Too easy' },
  { value: 'pain', label: 'It causes pain' },
  { value: 'unsafe', label: "Doesn't feel safe" },
  { value: 'equipment-missing', label: "I don't have the equipment" },
  { value: 'movement-not-possible', label: "I can't do this movement" },
  { value: 'want-seated', label: 'I want a seated option' },
  { value: 'want-lower-impact', label: 'I want lower impact' },
  { value: 'different-muscle', label: 'Work a different area' },
];

/** Make-it-easier menu (features.md §4.6) mapped onto engine contracts. */
const EASIER_OPTIONS: { label: string; reason: ReplacementReason }[] = [
  { label: 'Reduce reps by 2', reason: 'too-hard' },
  { label: 'Slow the tempo', reason: 'too-hard' },
  { label: 'Switch to seated version', reason: 'want-seated' },
  { label: 'Add 30 seconds rest', reason: 'too-hard' },
  { label: 'Replace this exercise', reason: 'movement-not-possible' },
];

const REGEN_MODES: { mode: RegenerationMode; label: string }[] = [
  { mode: 'easier', label: 'Easier' },
  { mode: 'harder', label: 'Harder' },
  { mode: 'shorter', label: 'Shorter' },
  { mode: 'seated', label: 'Seated only' },
  { mode: 'low-impact', label: 'Low impact' },
  { mode: 'more-core', label: 'More core' },
  { mode: 'more-upper', label: 'More upper body' },
  { mode: 'no-equipment', label: 'No equipment' },
  { mode: 'calmer', label: 'Calmer' },
  { mode: 'strength', label: 'Strength' },
];

type ItemStatus = 'upcoming' | 'current' | 'completed' | 'skipped';
type Effort = 'too-easy' | 'just-right' | 'too-hard' | null;

const SETS_PER_EXERCISE = 2;

function parseRepTarget(repsOrTime: string): number {
  const m = repsOrTime.match(/(\d+)/);
  return m ? Number(m[1]) : 8;
}

export default function AdaptiveWorkout() {
  const addToast = useToastStore((s) => s.addToast);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const reduced = useReduced();

  const [profile, setProfile] = useState<AbilityProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);

  // Player state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  const [setsDone, setSetsDone] = useState(0);
  const [repsDone, setRepsDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [effort, setEffort] = useState<Effort>(null);
  const [adaptationsCount, setAdaptationsCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const resetSessionState = useCallback((w: Workout) => {
    setCurrentIndex(0);
    setStatuses(w.exercises.map((_, i) => (i === 0 ? 'current' : 'upcoming')));
    setSetsDone(0);
    setRepsDone(0);
    setRunning(false);
    setSessionDone(false);
    setEffort(null);
    setAdaptationsCount(0);
    setSessionSeconds(0);
  }, []);

  const startFrom = useCallback(
    (source: AbilityProfile, label: string) => {
      const w = generateWorkout(source);
      setProfile(source);
      setWorkout(w);
      resetSessionState(w);
      addToast({
        type: 'success',
        title: 'Routine ready',
        description: `${label}: every move is safety-validated for you.`,
      });
    },
    [addToast, resetSessionState],
  );

  const loadPersona = useCallback(
    (id: string) => {
      const persona = personaById(id);
      if (!persona) return;
      const cloned: AbilityProfile = {
        ...persona.profile,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      startFrom(cloned, persona.name);
    },
    [startFrom],
  );

  const handleReplace = useCallback(
    (index: number, reason: ReplacementReason) => {
      if (!workout || !profile) return;
      const outcome = replaceExercise(workout, index, reason, profile);
      setWorkout(outcome.workout);
      setAdaptationsCount((c) => c + (outcome.replaced ? 1 : 0));
      addToast({
        type: outcome.replaced ? 'success' : 'info',
        title: outcome.replaced ? 'Swapped in a safe alternative' : 'No safe alternative found',
        description: outcome.message ?? '',
      });
    },
    [workout, profile, addToast],
  );

  const handleRegenerate = useCallback(
    (mode: RegenerationMode) => {
      if (!profile) return;
      const reshaped = applyRegeneration(profile, mode);
      const w = generateWorkout(reshaped);
      setProfile(reshaped);
      setWorkout(w);
      resetSessionState(w);
      setAdaptationsCount((c) => c + 1);
      addToast({
        type: 'success',
        title: 'Routine reshaped',
        description: 'Updated to match your request — still fully validated.',
      });
    },
    [profile, addToast, resetSessionState],
  );

  const current = workout?.exercises[currentIndex] ?? null;
  const repTarget = current ? parseRepTarget(current.repsOrTime) : 8;

  const advance = useCallback(
    (nextStatuses: ItemStatus[]) => {
      if (!workout) return;
      const nextIdx = nextStatuses.findIndex((s) => s === 'upcoming');
      if (nextIdx === -1) {
        setStatuses(nextStatuses);
        setSessionDone(true);
        setRunning(false);
        addToast({
          type: 'success',
          title: 'Workout complete. Well paced.',
          description: 'Every set finished or consciously skipped — that counts.',
        });
      } else {
        nextStatuses[nextIdx] = 'current';
        setStatuses(nextStatuses);
        setCurrentIndex(nextIdx);
        setSetsDone(0);
        setRepsDone(0);
      }
    },
    [workout, addToast],
  );

  const completeSet = useCallback(() => {
    if (!workout || !current) return;
    const done = setsDone + 1;
    setSetsDone(done);
    setRepsDone(0);
    if (done >= SETS_PER_EXERCISE) {
      const next = [...statuses];
      next[currentIndex] = 'completed';
      advance(next);
    } else {
      addToast({
        type: 'success',
        title: `Set ${done} of ${SETS_PER_EXERCISE} complete`,
        description: 'Rest, then start the next set when ready.',
      });
    }
  }, [workout, current, setsDone, currentIndex, advance, addToast]);

  const skipExercise = useCallback(() => {
    if (!workout) return;
    const next = [...statuses];
    next[currentIndex] = 'skipped';
    addToast({ type: 'info', title: 'Skipped', description: 'No problem — moving on.' });
    advance(next);
  }, [workout, statuses, currentIndex, advance, addToast]);

  const repTick = useCallback(() => {
    setRepsDone((r) => (r >= repTarget ? repTarget : r + 1));
  }, [repTarget]);

  // Simple session timer: 1s interval only while the player is running.
  const tickRef = useRef(() => setSessionSeconds((s) => s + 1));
  tickRef.current = () => setSessionSeconds((s) => s + 1);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mmss = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`;

  const completedCount = useMemo(
    () => statuses.filter((s) => s === 'completed').length,
    [statuses],
  );

  // ── Persona picker (entry state) ──────────────────────────────────────────
  if (!workout || !profile) {
    return (
      <div className="w-full space-y-8">
        <SectionHeader
          eyebrow="Adaptive workout"
          title="Today, at your pace."
          description="A personalized session that adjusts to your body scan, energy, and feedback. Every exercise passes a deterministic safety check — nothing unsafe for your body ever reaches the screen."
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Deterministic safety engine · no LLM
            </span>
          }
        />
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-3"
        >
          {DEMO_PERSONAS.map((p) => (
            <motion.div key={p.id} variants={reduced ? reducedItem : staggerItem}>
              <GlassPanel interactive className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Accessibility className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground-muted">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <Button
                  className="btn-aurora-primary mt-auto h-12 w-full rounded-[14px] text-sm font-semibold"
                  onClick={() => loadPersona(p.id)}
                >
                  {p.buttonLabel}
                </Button>
              </GlassPanel>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center">
          <Button
            variant="outline"
            className="h-12 gap-2 rounded-[14px] px-5"
            onClick={() => startFrom(createDefaultProfile(), 'Quick start')}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Quick start with a safe default profile
          </Button>
        </div>
      </div>
    );
  }

  // ── Session view ──────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      <SectionHeader
        eyebrow="Adaptive workout"
        title="Today, at your pace."
        description="A personalized session that adjusts to your body scan, energy, and feedback."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-[14px]"
              onClick={() => {
                setWorkout(null);
                setProfile(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Personas
            </Button>
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-[14px]"
              onClick={() => profile && startFrom(profile, 'Regenerated')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Regenerate plan
            </Button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {sessionDone ? (
          /* ── Completion state (features.md §4.7) ── */
          <motion.div
            key="done"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { scale: [0.96, 1.025, 1], opacity: 1 }}
            transition={reduced ? { duration: 0.14 } : { duration: 0.56, times: [0, 0.58, 1], ease: EASE.careOut }}
          >
            <GlassPanel className="mx-auto max-w-2xl p-6 text-center md:p-8">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
                Workout complete. Well paced.
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
                {[
                  { label: 'Duration', value: mmss },
                  { label: 'Completion', value: `${completedCount}/${statuses.length}` },
                  { label: 'Adaptations', value: String(adaptationsCount) },
                  { label: 'Style', value: workout.intensity.replace('-', ' ') },
                ].map((m) => (
                  <div key={m.label} className="rounded-[14px] bg-surface-raised p-3 text-center">
                    <p className="font-mono text-lg font-semibold capitalize tabular-nums text-foreground">
                      {m.value}
                    </p>
                    <p className="text-xs text-foreground-subtle">{m.label}</p>
                  </div>
                ))}
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-foreground">
                  How did that feel?
                </legend>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {(
                    [
                      { id: 'too-easy', label: 'Too easy' },
                      { id: 'just-right', label: 'Just right' },
                      { id: 'too-hard', label: 'Too hard' },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={effort === o.id}
                      onClick={() => setEffort(o.id)}
                      className={cn(
                        'inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors',
                        effort === o.id
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
                      )}
                    >
                      {effort === o.id && <Check className="h-4 w-4" aria-hidden="true" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  className="btn-aurora-primary h-12 rounded-[14px] px-5 text-sm font-semibold"
                  onClick={() => setActiveSection('dashboard')}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save and view dashboard
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-[14px] px-5 text-sm font-semibold"
                  onClick={() => setActiveSection('breathing')}
                >
                  <Wind className="mr-2 h-4 w-4" aria-hidden="true" />
                  Start cooldown breathing
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          /* ── Player layout: overview+timeline (4) / player (8) ── */
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: reduced ? 0.14 : 0.24 } }}
            className="grid grid-cols-1 gap-6 xl:grid-cols-12"
          >
            {/* Left: session overview + timeline */}
            <div className="space-y-6 xl:col-span-4">
              <GlassPanel className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  Session overview
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                  {workout.style}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                    <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                    {workout.intensity.replace('-', ' ')} day
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground-muted">
                    <Timer className="h-3.5 w-3.5" aria-hidden="true" />~{workout.estimatedMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground-muted">
                    <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                    {workout.exercises.length} exercises
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground-muted">
                    <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
                    Seated support included
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {workout.adaptationsUsed.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
                    >
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      {a}
                    </span>
                  ))}
                </div>
                {/* Regeneration toolbar */}
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-foreground-subtle">Reshape the whole routine:</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {REGEN_MODES.map((r) => (
                      <button
                        key={r.mode}
                        type="button"
                        onClick={() => handleRegenerate(r.mode)}
                        className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassPanel>

              {/* Exercise timeline */}
              <GlassPanel className="p-5">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Exercise timeline
                </h2>
                <ol className="mt-3 space-y-1.5">
                  {workout.exercises.map((ex, i) => {
                    const st = statuses[i] ?? 'upcoming';
                    return (
                      <li key={`${ex.id}-${i}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (st === 'completed' || st === 'skipped') return;
                            const next = [...statuses];
                            next[currentIndex] = 'upcoming';
                            next[i] = 'current';
                            setStatuses(next);
                            setCurrentIndex(i);
                            setSetsDone(0);
                            setRepsDone(0);
                          }}
                          aria-current={st === 'current' ? 'true' : undefined}
                          className={cn(
                            'relative flex min-h-16 w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left transition-colors',
                            st === 'current'
                              ? 'bg-primary-soft'
                              : 'hover:bg-surface-raised',
                            (st === 'completed' || st === 'skipped') && 'opacity-70',
                          )}
                        >
                          {st === 'current' && (
                            <motion.span
                              layoutId={reduced ? undefined : 'timeline-rail'}
                              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                              transition={SPRING.snappy}
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold',
                              st === 'completed'
                                ? 'bg-success-soft text-success'
                                : st === 'current'
                                  ? 'bg-primary text-primary-foreground'
                                  : st === 'skipped'
                                    ? 'bg-warning-soft text-warning'
                                    : 'bg-surface-raised text-foreground-muted',
                            )}
                          >
                            {st === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            ) : st === 'skipped' ? (
                              <SkipForward className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-foreground">
                              {ex.name}
                            </span>
                            <span className="block text-xs capitalize text-foreground-subtle">
                              {SETS_PER_EXERCISE} sets • {ex.repsOrTime} • {st}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </GlassPanel>
            </div>

            {/* Right: exercise player */}
            <div className="xl:col-span-8">
              {current && (
                <GlassPanel className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        Exercise {currentIndex + 1} of {workout.exercises.length}
                      </p>
                      <h2 className="mt-1.5 font-display text-2xl font-bold text-foreground">
                        {current.name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2.5 py-1 text-xs font-semibold capitalize text-secondary">
                        {current.posture === 'seated' || current.posture === 'wheelchair' ? (
                          <Armchair className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Dumbbell className="h-3 w-3" aria-hidden="true" />
                        )}
                        {current.posture.replace('-', ' ')}
                      </span>
                      <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-semibold capitalize text-foreground-muted">
                        {current.difficulty}
                      </span>
                      <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
                        Long rest {current.rest}
                      </span>
                    </div>
                  </div>

                  {/* Demo area 16:9 */}
                  <div className="mt-4 flex aspect-video items-center justify-center rounded-[18px] bg-surface-raised">
                    <div className="text-center">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Play className="ml-1 h-7 w-7" aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-sm font-medium text-foreground-muted">
                        Guided demo for {current.name}
                      </p>
                    </div>
                  </div>

                  {/* Rep counter + set progress + tempo */}
                  <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                    <button
                      type="button"
                      onClick={repTick}
                      aria-label={`Count a rep. ${repsDone} of ${repTarget} reps done.`}
                      className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-border bg-surface-raised"
                    >
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={repsDone}
                          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.16 }}
                          className="font-mono text-5xl font-semibold tabular-nums text-foreground"
                        >
                          {repsDone}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-xs uppercase tracking-wide text-foreground-subtle">
                        of {repTarget} reps
                      </span>
                    </button>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            Set {Math.min(setsDone + 1, SETS_PER_EXERCISE)} of {SETS_PER_EXERCISE}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-foreground-subtle">
                            {mmss}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-raised"
                          role="progressbar"
                          aria-valuenow={Math.round((repsDone / repTarget) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Current set progress"
                        >
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            animate={{ width: `${(repsDone / repTarget) * 100}%` }}
                            transition={reduced ? { duration: 0 } : { duration: 0.24, ease: EASE.standard }}
                          />
                        </div>
                      </div>
                      {/* Tempo visual */}
                      <div
                        className="grid grid-cols-3 gap-1.5"
                        role="img"
                        aria-label="Tempo: lower 2 seconds, hold 1 second, lift 2 seconds"
                      >
                        {[
                          { label: 'Lower 2s', flex: 2 },
                          { label: 'Hold 1s', flex: 1 },
                          { label: 'Lift 2s', flex: 2 },
                        ].map((seg) => (
                          <span
                            key={seg.label}
                            className={cn(
                              'flex h-8 items-center justify-center rounded-[10px] text-xs font-medium',
                              running && !reduced
                                ? 'bg-secondary-soft text-secondary'
                                : 'bg-surface-raised text-foreground-subtle',
                            )}
                          >
                            {seg.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Coaching cue */}
                  <div className="mt-5 flex items-start gap-2.5 rounded-[14px] bg-info-soft p-3.5 text-sm text-info">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>
                      <span className="font-semibold">Why this is safe for you: </span>
                      {current.selectionReason}
                    </p>
                  </div>

                  {(current.safetyNotes.length > 0 || current.seatedAlternative) && (
                    <div className="mt-3 grid gap-2 text-sm text-foreground-muted sm:grid-cols-2">
                      {current.safetyNotes.length > 0 && (
                        <p className="flex gap-1.5">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                          {current.safetyNotes[0]}
                        </p>
                      )}
                      {current.seatedAlternative && (
                        <p className="flex gap-1.5">
                          <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                          Seated option: {current.seatedAlternative}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      className="btn-aurora-primary h-14 rounded-[14px] px-6 text-base font-semibold"
                      onClick={() => setRunning((r) => !r)}
                      aria-label={running ? 'Pause session' : 'Start session'}
                    >
                      {running ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" aria-hidden="true" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" aria-hidden="true" /> Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-[52px] rounded-[14px] px-5 text-sm font-semibold"
                      onClick={completeSet}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Complete set
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-[52px] rounded-[14px] px-4 text-sm text-foreground-muted"
                      onClick={skipExercise}
                    >
                      <SkipForward className="mr-2 h-4 w-4" aria-hidden="true" />
                      Skip
                    </Button>

                    {/* Make it easier */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-[52px] gap-1.5 rounded-[14px] px-4 text-sm"
                        >
                          Make it easier <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Adapt this exercise</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {EASIER_OPTIONS.map((o) => (
                          <DropdownMenuItem
                            key={o.label}
                            onClick={() => handleReplace(currentIndex, o.reason)}
                          >
                            {o.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Swap for a safe alternative</DropdownMenuLabel>
                        {REPLACEMENT_REASONS.map((r) => (
                          <DropdownMenuItem
                            key={r.value}
                            onClick={() => handleReplace(currentIndex, r.value)}
                          >
                            {r.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Live announcement for adaptations */}
                  <div aria-live="polite" className="sr-only">
                    {`Now on exercise ${currentIndex + 1} of ${workout.exercises.length}: ${current.name}`}
                  </div>
                </GlassPanel>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="px-2 text-center text-xs text-foreground-subtle">
        General inclusive movement guidance only — not medical advice. Stop if you feel pain,
        dizziness, numbness or discomfort. Strength looks different for everyone.
      </p>
    </div>
  );
}
