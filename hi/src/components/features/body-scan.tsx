'use client';

/**
 * Body Scan — Clinical Aurora redesign (design/features.md §2).
 *
 * Guided pain/mobility check-in (not a medical form): an interactive body map
 * with 48px region hit targets and a front/back toggle, a 4-step question
 * stepper (where → discomfort → energy → what's possible), and a sticky
 * summary card. Saving writes a pain log via the existing /api/pain-logs
 * contract; "Update my workout" routes into the adaptive workout.
 *
 * NOTE: the previous camera pose-tracking surface was superseded by the
 * flagship Live Coach section; this file now implements the body-scan spec.
 */

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Check,
  HeartPulse,
  History,
  Info,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  ScanSearch,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
} from '@/components/ui/aurora';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToastStore } from '@/components/features/toast-provider';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

// ── Regions ─────────────────────────────────────────────────────────────────

interface Region {
  id: string;
  label: string;
  /** Marker position as % of the map container, per view */
  front: { x: number; y: number };
  back: { x: number; y: number };
  /** Maps to VALID_BODY_REGIONS in /api/pain-logs */
  apiRegion: string;
}

const REGIONS: Region[] = [
  { id: 'neck', label: 'Neck', front: { x: 50, y: 17 }, back: { x: 50, y: 17 }, apiRegion: 'neck' },
  { id: 'shoulders', label: 'Shoulders', front: { x: 35, y: 25 }, back: { x: 65, y: 25 }, apiRegion: 'shoulder' },
  { id: 'upper-back', label: 'Upper back', front: { x: 50, y: 33 }, back: { x: 50, y: 33 }, apiRegion: 'back' },
  { id: 'lower-back', label: 'Lower back', front: { x: 50, y: 47 }, back: { x: 50, y: 46 }, apiRegion: 'back' },
  { id: 'hips', label: 'Hips', front: { x: 42, y: 56 }, back: { x: 58, y: 56 }, apiRegion: 'hip' },
  { id: 'knees', label: 'Knees', front: { x: 41, y: 74 }, back: { x: 59, y: 74 }, apiRegion: 'knee' },
  { id: 'ankles', label: 'Ankles', front: { x: 40, y: 90 }, back: { x: 60, y: 90 }, apiRegion: 'ankle' },
  { id: 'wrists', label: 'Wrists', front: { x: 24, y: 46 }, back: { x: 76, y: 46 }, apiRegion: 'hand' },
];

function painBand(pain: number): { label: string; tone: string } {
  if (pain <= 2) return { label: 'Comfortable', tone: 'bg-success-soft text-success' };
  if (pain <= 4) return { label: 'Mild', tone: 'bg-primary-soft text-primary' };
  if (pain <= 6) return { label: 'Moderate', tone: 'bg-warning-soft text-warning' };
  if (pain <= 8) return { label: 'High', tone: 'bg-warning-soft text-warning' };
  return { label: 'Severe', tone: 'bg-danger-soft text-danger' };
}

const ENERGY_OPTIONS = [
  { id: 'very-low', label: 'Very low', icon: BatteryLow },
  { id: 'low', label: 'Low', icon: BatteryLow },
  { id: 'steady', label: 'Steady', icon: BatteryMedium },
  { id: 'good', label: 'Good', icon: BatteryFull },
  { id: 'strong', label: 'Strong', icon: Zap },
];

const POSSIBILITY_OPTIONS = [
  { id: 'rest', label: 'Rest', desc: 'Recovery first — gentle breathing only.' },
  { id: 'gentle-mobility', label: 'Gentle mobility', desc: 'Slow range-of-motion work.' },
  { id: 'strength', label: 'Strength', desc: 'A steady, supported strength session.' },
  { id: 'full-plan', label: 'Full plan', desc: 'I feel ready for the complete session.' },
];

const STEPS = [
  'Where do you feel it?',
  'How strong is the discomfort?',
  'How is your energy?',
  'What feels possible today?',
];

// ── Body map SVG (inclusive neutral silhouette, emerald line work) ──────────

function BodySilhouette({ view }: { view: 'front' | 'back' }) {
  const line = 'var(--foreground-subtle)';
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full" aria-hidden="true">
      <g fill="none" stroke={line} strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round">
        {/* Head */}
        <circle cx="50" cy="10" r="7" />
        {/* Neck + spine */}
        <path d="M50 17 V58" />
        {/* Shoulders + arms */}
        <path d="M34 26 H66" />
        <path d="M34 26 L26 42 L24 50" />
        <path d="M66 26 L74 42 L76 50" />
        {/* Torso */}
        <path d="M34 26 L38 58 L62 58 L66 26" />
        {/* Legs */}
        <path d="M38 58 L36 88 L35 106" />
        <path d="M62 58 L64 88 L65 106" />
        {/* Feet */}
        <path d="M35 106 L31 106 M65 106 L69 106" />
      </g>
      {/* Back-view hint: spine segments */}
      {view === 'back' && (
        <g fill="none" stroke={line} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 3">
          <path d="M44 30 H56 M44 38 H56 M44 46 H56" />
        </g>
      )}
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function BodyScan() {
  const addToast = useToastStore((s) => s.addToast);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const reduced = useReduced();

  const [view, setView] = useState<'front' | 'back'>('front');
  const [zoom, setZoom] = useState(1);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pain, setPain] = useState(3);
  const [energy, setEnergy] = useState<string | null>(null);
  const [possibility, setPossibility] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleRegion = useCallback((id: string) => {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }, []);

  const band = painBand(pain);
  const regionLabels = selectedRegions
    .map((id) => REGIONS.find((r) => r.id === id)?.label)
    .filter(Boolean) as string[];

  const statusText = useMemo(() => {
    if (pain >= 7 || possibility === 'rest') return 'Rest or very gentle movement recommended';
    if (pain >= 4 || possibility === 'gentle-mobility') return 'Gentle strength recommended';
    return 'Full plan ready when you are';
  }, [pain, possibility]);

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    },
    [step],
  );

  const saveScan = useCallback(
    async (thenNavigate: boolean) => {
      if (saving) return;
      setSaving(true);
      const primaryRegion =
        REGIONS.find((r) => r.id === selectedRegions[0])?.apiRegion ?? 'back';
      try {
        await fetch('/api/pain-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'default-user',
            painLevel: Math.max(1, pain), // API contract: 1–10
            painType: 'aching',
            bodyRegion: primaryRegion,
            symptoms: regionLabels.join(', '),
            trigger: null,
            reliefMeasures: null,
            mood: energy,
            activityLevel: possibility,
            notes: `Body scan — ${statusText}`,
          }),
        }).catch(() => {
          /* logging is best-effort; the scan still completes locally */
        });
        addToast({
          type: 'success',
          title: 'Body scan saved',
          description: thenNavigate
            ? 'Your workout will be adjusted to today’s body signal.'
            : 'Your check-in is recorded.',
        });
        if (thenNavigate) setActiveSection('adaptive-workout');
      } finally {
        setSaving(false);
      }
    },
    [saving, pain, selectedRegions, regionLabels, energy, possibility, statusText, addToast, setActiveSection],
  );

  const stepContent = [
    // 1. Where
    <div key="where" className="space-y-3">
      <p className="text-sm text-foreground-muted">
        Tap the map or choose from the list — select every area that needs attention.
      </p>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => {
          const active = selectedRegions.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggleRegion(r.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
              )}
            >
              {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {r.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={selectedRegions.includes('other')}
          onClick={() => toggleRegion('other')}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
            selectedRegions.includes('other')
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
          )}
        >
          Other
        </button>
      </div>
    </div>,

    // 2. Discomfort
    <div key="pain" className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {pain}/10
        </span>
        <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', band.tone)}>
          {band.label}
        </span>
      </div>
      <Slider
        value={[pain]}
        onValueChange={([v]) => setPain(v)}
        min={0}
        max={10}
        step={1}
        aria-label="Discomfort level from 0 to 10"
        className="py-3"
      />
      <div className="flex justify-between text-xs text-foreground-subtle">
        <span>0 — Comfortable</span>
        <span>10 — Severe</span>
      </div>
      {pain >= 7 && (
        <div className="rounded-[14px] bg-danger-soft p-3.5 text-sm text-danger">
          <p className="font-semibold">High discomfort selected.</p>
          <p className="mt-1">Choose gentle movement or rest today.</p>
          <button
            type="button"
            onClick={() => setActiveSection('crisis')}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Open crisis/support resources
          </button>
        </div>
      )}
    </div>,

    // 3. Energy
    <div key="energy" className="grid grid-cols-1 gap-2 sm:grid-cols-5">
      {ENERGY_OPTIONS.map((opt) => {
        const active = energy === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => setEnergy(opt.id)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] border px-2 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
            )}
          >
            <opt.icon className="h-5 w-5" aria-hidden="true" />
            {opt.label}
          </button>
        );
      })}
    </div>,

    // 4. What feels possible
    <div key="possible" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {POSSIBILITY_OPTIONS.map((opt) => {
        const active = possibility === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => setPossibility(opt.id)}
            className={cn(
              'flex min-h-14 flex-col items-start gap-0.5 rounded-[14px] border p-4 text-left transition-colors',
              active
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface hover:bg-surface-raised',
            )}
          >
            <span className={cn('flex items-center gap-1.5 text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
              {active && <Check className="h-4 w-4" aria-hidden="true" />}
              {opt.label}
            </span>
            <span className="text-xs text-foreground-muted">{opt.desc}</span>
          </button>
        );
      })}
    </div>,
  ];

  return (
    <div className="w-full space-y-6">
      <SectionHeader
        eyebrow="Body scan"
        title="Listen to your body today."
        description="Map discomfort, mobility, and energy so AdaptiFit can adjust your plan."
        actions={
          <Button
            variant="outline"
            className="h-12 gap-2 rounded-[14px]"
            onClick={() =>
              addToast({
                type: 'info',
                title: 'Scan history',
                description: 'Your pain log history lives in the Pain journal on the dashboard tools.',
              })
            }
          >
            <History className="h-4 w-4" aria-hidden="true" />
            View scan history
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ── Body map card (5 cols) ── */}
        <motion.div
          className="lg:col-span-5"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0.14 } : { duration: 0.42, ease: EASE.careOut }}
        >
          <GlassPanel radius="2xl" className="p-6">
            {/* Front/back segmented toggle */}
            <div
              role="group"
              aria-label="Body view"
              className="mx-auto flex h-12 w-full max-w-xs items-center rounded-full border border-border bg-surface p-1"
            >
              {(['front', 'back'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    'h-full flex-1 rounded-full text-sm font-semibold capitalize transition-colors',
                    view === v
                      ? 'bg-surface-raised text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Map */}
            <div className="relative mx-auto mt-4 aspect-[5/6] w-full max-w-[360px] overflow-hidden rounded-[18px] bg-surface-raised/60">
              <div
                className="absolute inset-4 transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
              >
                <BodySilhouette view={view} />
              </div>
              {/* Region hit targets: 48px invisible button, 20px visible marker */}
              {REGIONS.map((r, i) => {
                const pos = view === 'front' ? r.front : r.back;
                const active = selectedRegions.includes(r.id);
                return (
                  <motion.button
                    key={`${view}-${r.id}`}
                    type="button"
                    onClick={() => toggleRegion(r.id)}
                    aria-pressed={active}
                    aria-label={`${r.label} — ${active ? 'selected' : 'not selected'}`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                      reduced
                        ? { duration: 0.14 }
                        : { duration: 0.18, delay: 0.1 + i * 0.035, ease: EASE.careOut }
                    }
                    className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                        active
                          ? 'border-primary bg-primary'
                          : 'border-secondary bg-secondary/40',
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />}
                    </span>
                    {active && (
                      <span className="absolute -bottom-5 whitespace-nowrap rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                        {r.label}
                      </span>
                    )}
                  </motion.button>
                );
              })}

              {/* Zoom controls */}
              <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                {[
                  { icon: Plus, label: 'Zoom in', fn: () => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(2))) },
                  { icon: Minus, label: 'Zoom out', fn: () => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2))) },
                  { icon: RotateCcw, label: 'Reset zoom', fn: () => setZoom(1) },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    aria-label={b.label}
                    onClick={b.fn}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-overlay text-foreground shadow-sm transition-colors hover:bg-surface-raised"
                  >
                    <b.icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-foreground-subtle">
              {selectedRegions.length === 0
                ? 'Tap a marker to flag an area.'
                : `${regionLabels.length} area${regionLabels.length > 1 ? 's' : ''} selected: ${regionLabels.join(', ')}`}
            </p>
          </GlassPanel>
        </motion.div>

        {/* ── Right column (7 cols): stepper + summary ── */}
        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            {/* Guided questions */}
            <GlassPanel className="p-5 md:p-6">
              {/* Stepper header */}
              <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
                {STEPS.map((s, i) => (
                  <li key={s} className="flex flex-1 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        i < step
                          ? 'bg-primary text-primary-foreground'
                          : i === step
                            ? 'bg-primary-soft text-primary ring-2 ring-primary'
                            : 'bg-surface-raised text-foreground-subtle',
                      )}
                    >
                      {i < step ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')}
                      />
                    )}
                  </li>
                ))}
              </ol>

              <h2 className="mt-5 font-display text-xl font-semibold text-foreground sm:text-2xl">
                {STEPS[step]}
              </h2>

              {/* Step content with slide transition */}
              <div className="mt-4 min-h-[220px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 24 : -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -24 : 24 }}
                    transition={reduced ? { duration: 0.14 } : { duration: 0.26, ease: EASE.careOut }}
                  >
                    {stepContent[step]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stepper footer */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="h-12 gap-1.5 rounded-[14px]"
                  onClick={() => goTo(step - 1)}
                  disabled={step === 0}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <span className="text-sm text-foreground-subtle">
                  Step {step + 1} of {STEPS.length}
                </span>
                {step < STEPS.length - 1 ? (
                  <Button
                    className="btn-aurora-primary h-12 gap-1.5 rounded-[14px] px-5"
                    onClick={() => goTo(step + 1)}
                  >
                    Next
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    className="btn-aurora-primary h-12 gap-1.5 rounded-[14px] px-5"
                    onClick={() => saveScan(true)}
                    disabled={saving}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Update my workout
                  </Button>
                )}
              </div>
            </GlassPanel>

            {/* Summary card — sticky on desktop */}
            <GlassPanel className="p-5 xl:sticky xl:top-24">
              <div className="flex items-center gap-2">
                <ScanSearch className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Today&apos;s body signal
                </h2>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.18 } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="mt-3 text-base font-semibold text-primary"
                >
                  {statusText}
                </motion.p>
              </AnimatePresence>
              <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
                <li className="flex items-center gap-2">
                  <ScanSearch className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                  Areas: {regionLabels.length ? regionLabels.join(', ') : 'None selected'}
                </li>
                <li className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  Discomfort: {pain}/10 — {band.label}
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Energy: {ENERGY_OPTIONS.find((e) => e.id === energy)?.label ?? 'Not set'}
                </li>
              </ul>
              <div className="mt-4 space-y-2">
                <Button
                  className="btn-aurora-primary h-12 w-full rounded-[14px] text-sm font-semibold"
                  onClick={() => saveScan(true)}
                  disabled={saving}
                >
                  Update my workout
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-[14px] text-sm font-semibold"
                  onClick={() => saveScan(false)}
                  disabled={saving}
                >
                  Save scan only
                </Button>
              </div>
              <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-foreground-subtle">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                This scan is guidance, not a medical diagnosis.
              </p>
            </GlassPanel>
          </div>
        </div>
      </div>

      {/* Live region for selections */}
      <div aria-live="polite" className="sr-only">
        {selectedRegions.length > 0
          ? `Selected areas: ${regionLabels.join(', ')}. Discomfort ${pain} of 10, ${band.label}.`
          : ''}
      </div>
    </div>
  );
}
