'use client';

/**
 * Adaptive Workout — merged from the root "Adaptive Motion Gym" project.
 *
 * This surfaces that project's genuinely unique value: a fully deterministic,
 * accessibility-first workout engine. Pick a demo persona (or a safe default
 * profile) and the engine builds a validated routine where EVERY exercise has
 * passed a Smart Exclusion + Safety Validation gate. You can swap any exercise
 * ("this doesn't work for me") for a safe alternative, or reshape the whole
 * routine (seated, easier, low-impact, …) — all without any LLM or network call.
 *
 * The engine itself lives, unchanged, in src/lib/adaptive-gym/ (pure TypeScript).
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accessibility,
  Sparkles,
  ShieldCheck,
  Info,
  RefreshCw,
  ChevronDown,
  Timer,
  Dumbbell,
  Armchair,
  ArrowLeft,
  HeartHandshake,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToastStore } from '@/components/features/toast-provider';

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

const postureIcon = (posture: string) =>
  posture === 'seated' || posture === 'wheelchair' ? (
    <Armchair className="w-3 h-3" />
  ) : (
    <Dumbbell className="w-3 h-3" />
  );

export default function AdaptiveWorkout() {
  const addToast = useToastStore((s) => s.addToast);
  const [profile, setProfile] = useState<AbilityProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);

  const startFrom = useCallback((source: AbilityProfile, label: string) => {
    setProfile(source);
    setWorkout(generateWorkout(source));
    addToast({ type: 'success', title: 'Routine ready', description: `${label}: every move is safety-validated for you.` });
  }, [addToast]);

  const loadPersona = useCallback((id: string) => {
    const persona = personaById(id);
    if (!persona) return;
    const cloned: AbilityProfile = { ...persona.profile, createdAt: Date.now(), updatedAt: Date.now() };
    startFrom(cloned, persona.name);
  }, [startFrom]);

  const handleReplace = useCallback((index: number, reason: ReplacementReason) => {
    if (!workout || !profile) return;
    const outcome = replaceExercise(workout, index, reason, profile);
    setWorkout(outcome.workout);
    addToast({
      type: outcome.replaced ? 'success' : 'info',
      title: outcome.replaced ? 'Swapped in a safe alternative' : 'No safe alternative found',
      description: outcome.message ?? '',
    });
  }, [workout, profile, addToast]);

  const handleRegenerate = useCallback((mode: RegenerationMode) => {
    if (!profile) return;
    const reshaped = applyRegeneration(profile, mode);
    setProfile(reshaped);
    setWorkout(generateWorkout(reshaped));
    addToast({ type: 'success', title: 'Routine reshaped', description: 'Updated to match your request — still fully validated.' });
  }, [profile, addToast]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Deterministic safety engine · no LLM
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Adaptive Workout</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fitness that adapts to <em>you</em>. Every exercise is filtered through a Smart Exclusion
          Engine and a Safety Validation Loop — nothing unsafe for your body ever reaches the screen.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!workout || !profile ? (
          <motion.div key="personas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {DEMO_PERSONAS.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Accessibility className="w-5 h-5 text-emerald-500" />
                        {p.name}
                      </CardTitle>
                      <CardDescription>{p.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.highlights.map((h) => (
                          <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>
                        ))}
                      </div>
                      <Button className="mt-auto w-full" onClick={() => loadPersona(p.id)}>
                        {p.buttonLabel}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => startFrom(createDefaultProfile(), 'Quick start')}
              >
                <Sparkles className="w-4 h-4" /> Quick start with a safe default profile
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Plan header */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{workout.style}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1"><Timer className="w-4 h-4" /> ~{workout.estimatedMinutes} min</span>
                      <span className="inline-flex items-center gap-1"><Dumbbell className="w-4 h-4" /> {workout.exercises.length} exercises</span>
                      <span className="capitalize">{workout.intensity.replace('-', ' ')}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setWorkout(null); setProfile(null); }}>
                      <ArrowLeft className="w-4 h-4" /> Personas
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={() => profile && setWorkout(generateWorkout(profile))}>
                      <RefreshCw className="w-4 h-4" /> Fresh routine
                    </Button>
                  </div>
                </div>

                {/* Adaptation labels — proof the engine adapted to the body */}
                <div className="flex flex-wrap gap-1.5">
                  {workout.adaptationsUsed.map((a) => (
                    <Badge key={a} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1">
                      <ShieldCheck className="w-3 h-3" /> {a}
                    </Badge>
                  ))}
                </div>

                {/* Regeneration toolbar */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                  <span className="text-xs text-muted-foreground w-full pt-2">Reshape the whole routine:</span>
                  {REGEN_MODES.map((r) => (
                    <Button key={r.mode} size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleRegenerate(r.mode)}>
                      {r.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exercise list */}
            <div className="space-y-3">
              {workout.exercises.map((ex, i) => (
                <motion.div key={`${ex.id}-${i}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="grid place-items-center w-6 h-6 rounded-full bg-muted text-xs font-semibold shrink-0">{i + 1}</span>
                            <h3 className="font-semibold">{ex.name}</h3>
                            <Badge variant="outline" className="text-[10px] capitalize gap-1">{postureIcon(ex.posture)} {ex.posture.replace('-', ' ')}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{ex.difficulty}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{ex.repsOrTime}</span> · rest {ex.rest}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0">
                              This doesn&apos;t work <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Swap for a safe alternative</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {REPLACEMENT_REASONS.map((r) => (
                              <DropdownMenuItem key={r.value} onClick={() => handleReplace(i, r.value)}>
                                {r.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Target muscles */}
                      <div className="flex flex-wrap gap-1.5">
                        {ex.targetMuscles.map((m) => (
                          <Badge key={m} variant="secondary" className="text-[10px] capitalize">{m}</Badge>
                        ))}
                      </div>

                      {/* Why this — transparency from the safety engine */}
                      <div className="rounded-lg bg-muted/50 p-2.5 text-xs flex gap-2">
                        <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><span className="font-medium">Why this is safe for you: </span>{ex.selectionReason}</span>
                      </div>

                      {/* Safety notes + seated alternative */}
                      {(ex.safetyNotes.length > 0 || ex.seatedAlternative) && (
                        <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {ex.safetyNotes.length > 0 && (
                            <p className="flex gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{ex.safetyNotes[0]}</p>
                          )}
                          {ex.seatedAlternative && (
                            <p className="flex gap-1.5"><Armchair className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />Seated option: {ex.seatedAlternative}</p>
                          )}
                        </div>
                      )}

                      {ex.confidenceNote && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5" /> {ex.confidenceNote}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              General inclusive movement guidance only — not medical advice. Stop if you feel pain,
              dizziness, numbness or discomfort. Strength looks different for everyone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
