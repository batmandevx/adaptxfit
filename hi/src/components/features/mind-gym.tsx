'use client';

/**
 * Mind Gym — a calm cognitive arcade (mind-gym.md).
 *
 * Four gentle brain-training exercises, all local to the browser:
 *  - Focus Timer (ADHD / focus): a gentle Pomodoro with body-doubling encouragement.
 *  - Attention Game (Go / No-Go): trains sustained attention & impulse control.
 *  - Memory Match: a working-memory pairs game.
 *  - Daily Check-In (brain fog): adapts a gentle recommendation to how today feels.
 *
 * Visual system: Clinical Aurora — soft token capsules, glass surfaces,
 * pressure-free copy ("play", never "fail"), reduced-motion aware.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Target,
  Grid3x3,
  HeartPulse,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Trophy,
  Clock3,
  Signal,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
  DURATION,
  staggerContainer,
  staggerItem,
} from '@/components/ui/aurora';
import { cn } from '@/lib/utils';
import { useToastStore } from './toast-provider';
import { useT, type TranslationKey } from '@/lib/i18n';

type GameId = 'hub' | 'focus' | 'attention' | 'memory' | 'checkin';

interface GameMeta {
  id: Exclude<GameId, 'hub'>;
  nameKey: TranslationKey;
  areaKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: React.ReactNode;
  /** Token tone for the icon capsule + accents (no gradients) */
  tone: 'primary' | 'secondary' | 'accent' | 'info';
  /** Session length hint, e.g. "2 min" */
  duration: string;
  /** Pressure-free difficulty label */
  difficultyKey: 'Gentle' | 'Steady' | 'Focused';
}

const TONE_CAPSULE: Record<GameMeta['tone'], string> = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
  info: 'bg-info-soft text-info',
};

const GAMES: GameMeta[] = [
  { id: 'focus', nameKey: 'mindgym.games.focus.name', areaKey: 'mindgym.games.focus.area', descriptionKey: 'mindgym.games.focus.description', icon: <Timer className="h-6 w-6" />, tone: 'primary', duration: '5–25 min', difficultyKey: 'Gentle' },
  { id: 'attention', nameKey: 'mindgym.games.attention.name', areaKey: 'mindgym.games.attention.area', descriptionKey: 'mindgym.games.attention.description', icon: <Target className="h-6 w-6" />, tone: 'secondary', duration: '2 min', difficultyKey: 'Focused' },
  { id: 'memory', nameKey: 'mindgym.games.memory.name', areaKey: 'mindgym.games.memory.area', descriptionKey: 'mindgym.games.memory.description', icon: <Grid3x3 className="h-6 w-6" />, tone: 'accent', duration: '3 min', difficultyKey: 'Gentle' },
  { id: 'checkin', nameKey: 'mindgym.games.checkin.name', areaKey: 'mindgym.games.checkin.area', descriptionKey: 'mindgym.games.checkin.description', icon: <HeartPulse className="h-6 w-6" />, tone: 'info', duration: '1 min', difficultyKey: 'Gentle' },
];

/** Small static focus-score ring for the hub header (mind-gym.md §3). */
function FocusRing({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[112px] w-[112px]">
      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" strokeWidth="9" className="stroke-border/45" />
        <circle
          cx="56" cy="56" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">Focus</span>
      </div>
    </div>
  );
}

export default function MindGym() {
  const [game, setGame] = useState<GameId>('hub');
  const [played, setPlayed] = useState<Partial<Record<Exclude<GameId, 'hub'>, boolean>>>({});
  const t = useT();
  const reduced = useReduced();

  const activeMeta = game === 'hub' ? null : GAMES.find((g) => g.id === game)!;
  const playedCount = GAMES.filter((g) => played[g.id]).length;

  const openGame = (id: Exclude<GameId, 'hub'>) => setGame(id);
  const exitToHub = () => {
    if (game !== 'hub') setPlayed((p) => ({ ...p, [game]: true }));
    setGame('hub');
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <SectionHeader
        eyebrow="MIND GYM"
        title="Train focus gently."
        description="Short, low-pressure games for attention, memory and mental clarity. Two minutes counts — there are no streaks to break here."
        actions={
          <div className="flex items-center gap-4 rounded-[18px] border border-border/60 bg-surface/60 px-4 py-2">
            <FocusRing value={62 + playedCount * 8} />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Steady this week</p>
              <p className="text-xs text-foreground-subtle">Focus score is a guide, not a grade.</p>
            </div>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {game === 'hub' ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.14 : DURATION.standard }}
            className="space-y-5"
          >
            {/* Today's gentle session strip */}
            <div className="flex flex-col gap-4 rounded-[24px] bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface/70 text-primary">
                  <Leaf className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Today&apos;s cognitive session</p>
                  <p className="text-sm text-foreground-muted">
                    3 short games · about 7 minutes · low pressure — stop whenever you like.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => openGame('attention')}
                  className="btn-aurora-primary h-12 gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                >
                  <Play className="h-4 w-4" /> Continue
                </Button>
                <span className="hidden text-xs text-foreground-subtle sm:block">or pick any game below</span>
              </div>
            </div>

            {/* Game cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {GAMES.map((g) => (
                <motion.div key={g.id} variants={reduced ? undefined : staggerItem}>
                  <GlassPanel interactive className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between">
                      <span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', TONE_CAPSULE[g.tone])}>
                        {g.icon}
                      </span>
                      {played[g.id] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{t(g.nameKey)}</h3>
                      <p className="mt-1 text-sm leading-6 text-foreground-muted">{t(g.descriptionKey)}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground-muted">
                        <Signal className="h-3 w-3" /> {g.difficultyKey}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground-muted">
                        <Clock3 className="h-3 w-3" /> {g.duration}
                      </span>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', TONE_CAPSULE[g.tone])}>
                        {t(g.areaKey)}
                      </span>
                    </div>
                    <Button
                      onClick={() => openGame(g.id)}
                      variant="outline"
                      className="mt-1 h-11 w-full gap-2 rounded-[14px] border-primary/40 text-primary hover:bg-primary-soft"
                    >
                      <Play className="h-4 w-4" /> Play
                    </Button>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>

            <p className="text-center text-xs text-foreground-subtle">
              Everything runs on this device. Scores are a personal guide — never a judgement.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={game}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.14 : DURATION.standard, ease: EASE.careOut }}
          >
            {/* Game chrome: calm header with a clear way out */}
            <GlassPanel className="mx-auto max-w-2xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', TONE_CAPSULE[activeMeta.tone])}>
                    {activeMeta.icon}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">{t(activeMeta.nameKey)}</h2>
                    <p className="text-xs text-foreground-subtle">{t(activeMeta.areaKey)} · {activeMeta.duration} · pause anytime</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={exitToHub} className="h-11 gap-2 rounded-[14px]">
                  <ArrowLeft className="h-4 w-4" /> {t('mindgym.back')}
                </Button>
              </div>
              {game === 'focus' && <FocusTimer />}
              {game === 'attention' && <AttentionGame />}
              {game === 'memory' && <MemoryMatch />}
              {game === 'checkin' && <DailyCheckIn />}
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Focus Timer ───────────────────────────────────────────────────────────────
function FocusTimer() {
  const addToast = useToastStore((s) => s.addToast);
  const t = useT();
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const wasBreak = onBreak;
          addToast({
            type: 'success',
            title: t(wasBreak ? 'mindgym.focusTimer.toastBreakTitle' : 'mindgym.focusTimer.toastFocusTitle'),
            description: t(wasBreak ? 'mindgym.focusTimer.toastBreakDescription' : 'mindgym.focusTimer.toastFocusDescription'),
          });
          setOnBreak(!wasBreak);
          setRunning(false);
          return (wasBreak ? minutes : 5) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onBreak, minutes, addToast, t]);

  useEffect(() => {
    if (!running) setSecondsLeft((onBreak ? 5 : minutes) * 60);
  }, [minutes, onBreak, running]);

  const total = (onBreak ? 5 : minutes) * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-foreground-muted">
        {t(onBreak ? 'mindgym.focusTimer.breakDescription' : 'mindgym.focusTimer.focusDescription')}
      </p>
      <div className="relative grid place-items-center py-4">
        <svg viewBox="0 0 120 120" className="h-48 w-48 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-border/45" />
          <motion.circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
            className={onBreak ? 'stroke-secondary' : 'stroke-primary'}
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-mono text-4xl font-semibold tabular-nums text-foreground">{mm}:{ss}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
            {t(onBreak ? 'mindgym.focusTimer.breakLabel' : 'mindgym.focusTimer.focusLabel')}
          </div>
        </div>
      </div>

      {!running && !onBreak && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">{t('mindgym.focusTimer.blockLength')}</span>
            <span className="font-medium text-foreground">{t('common.minutes', { count: minutes })}</span>
          </div>
          <Slider value={[minutes]} min={5} max={50} step={5} onValueChange={(v) => setMinutes(v[0])} />
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button
          onClick={() => setRunning((r) => !r)}
          className="btn-aurora-primary h-12 min-w-36 gap-2 rounded-[14px] text-[15px] font-semibold"
        >
          {running ? <><Pause className="h-4 w-4" /> {t('common.pause')}</> : <><Play className="h-4 w-4" /> {t('common.start')}</>}
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-[14px]"
          onClick={() => { setRunning(false); setOnBreak(false); setSecondsLeft(minutes * 60); }}
        >
          <RotateCcw className="h-4 w-4" /> {t('common.reset')}
        </Button>
      </div>
    </div>
  );
}

// ── Attention Game (Go / No-Go) ───────────────────────────────────────────────
const TOTAL_TRIALS = 20;
const STIM_MS = 850;

function AttentionGame() {
  const addToast = useToastStore((s) => s.addToast);
  const t = useT();
  const reduced = useReduced();
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [stim, setStim] = useState<'go' | 'nogo' | null>(null);
  const [trial, setTrial] = useState(0);
  const [result, setResult] = useState<{ acc: number; avgRt: number; hits: number; misses: number; cr: number; fa: number } | null>(null);

  const stats = useRef({ hits: 0, misses: 0, cr: 0, fa: 0, rts: [] as number[] });
  const trialRef = useRef(0);
  const responded = useRef(false);
  const shownAt = useRef(0);
  const stimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  const stimRef = useRef(stim);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { stimRef.current = stim; }, [stim]);

  const finish = useCallback(() => {
    setPhase('done');
    setStim(null);
    const s = stats.current;
    const acc = (s.hits + s.cr) / TOTAL_TRIALS;
    const avgRt = s.rts.length ? Math.round(s.rts.reduce((a, b) => a + b, 0) / s.rts.length) : 0;
    setResult({ acc, avgRt, hits: s.hits, misses: s.misses, cr: s.cr, fa: s.fa });
    addToast({
      type: 'success',
      title: t('mindgym.attention.roundCompleteTitle'),
      description: t('mindgym.attention.roundCompleteDescription', { accuracy: Math.round(acc * 100) }),
    });
  }, [addToast, t]);

  const gap = useCallback(() => {
    setStim(null);
    gapTimer.current = setTimeout(() => {
      const type: 'go' | 'nogo' = Math.random() < 0.7 ? 'go' : 'nogo';
      responded.current = false;
      shownAt.current = performance.now();
      setStim(type);
      stimTimer.current = setTimeout(() => endStim(type, false), STIM_MS);
    }, 550 + Math.random() * 500);
  }, []);

  const endStim = useCallback((type: 'go' | 'nogo', wasResponse: boolean) => {
    if (stimTimer.current) clearTimeout(stimTimer.current);
    if (!wasResponse) {
      if (type === 'go') stats.current.misses++;
      else stats.current.cr++;
    }
    setStim(null);
    trialRef.current += 1;
    setTrial(trialRef.current);
    if (trialRef.current >= TOTAL_TRIALS) finish();
    else gap();
  }, [finish, gap]);

  const respond = useCallback(() => {
    if (phaseRef.current !== 'running' || !stimRef.current || responded.current) return;
    responded.current = true;
    const rt = performance.now() - shownAt.current;
    if (stimRef.current === 'go') { stats.current.hits++; stats.current.rts.push(rt); }
    else stats.current.fa++;
    endStim(stimRef.current, true);
  }, [endStim]);

  const begin = useCallback(() => {
    stats.current = { hits: 0, misses: 0, cr: 0, fa: 0, rts: [] };
    trialRef.current = 0;
    setTrial(0);
    setResult(null);
    setPhase('running');
    gap();
  }, [gap]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); respond(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [respond]);

  useEffect(() => () => {
    if (stimTimer.current) clearTimeout(stimTimer.current);
    if (gapTimer.current) clearTimeout(gapTimer.current);
  }, []);

  const stimInitial = reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 };
  const stimAnimate = { scale: 1, opacity: 1 };
  const stimExit = reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 };

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm leading-6 text-foreground-muted">{t('mindgym.attention.instructions')}</p>
      {phase === 'idle' && (
        <div className="space-y-4 py-10">
          <p className="text-foreground-muted">{t('mindgym.attention.ready', { count: TOTAL_TRIALS })}</p>
          <Button size="lg" onClick={begin} className="btn-aurora-primary h-12 rounded-[14px] px-6 text-[15px] font-semibold">
            {t('common.start')}
          </Button>
        </div>
      )}

      {phase === 'running' && (
        <div className="space-y-3">
          <div className="text-sm text-foreground-muted">{t('mindgym.attention.round', { current: trial + 1, total: TOTAL_TRIALS })}</div>
          <button onClick={respond} aria-label="Respond" className="mx-auto grid h-56 w-56 select-none place-items-center">
            <AnimatePresence mode="wait">
              {stim === 'go' && (
                <motion.div key="go" initial={stimInitial} animate={stimAnimate} exit={stimExit}
                  className="grid h-40 w-40 place-items-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-[var(--shadow-glow-primary)]">{t('mindgym.attention.go')}</motion.div>
              )}
              {stim === 'nogo' && (
                <motion.div key="nogo" initial={stimInitial} animate={stimAnimate} exit={stimExit}
                  className="grid h-36 w-36 place-items-center rounded-[24px] bg-accent text-3xl font-bold text-accent-foreground shadow-lg">{t('mindgym.attention.stop')}</motion.div>
              )}
              {!stim && <motion.div key="rest" className="text-4xl text-foreground-subtle">＋</motion.div>}
            </AnimatePresence>
          </button>
          <p className="text-xs text-foreground-subtle">{t('mindgym.attention.hint')}</p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="space-y-4 py-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <Trophy className="h-8 w-8 text-success" />
          </span>
          <h3 className="font-display text-2xl font-semibold text-foreground">{t('mindgym.attention.accuracy', { accuracy: Math.round(result.acc * 100) })}</h3>
          <p className="text-foreground-muted"><b>{t('mindgym.attention.averageReaction', { time: result.avgRt || '—' })}</b></p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">{t('mindgym.attention.goHits', { count: result.hits })}</Badge>
            <Badge variant="secondary">{t('mindgym.attention.correctStops', { count: result.cr })}</Badge>
            <Badge variant="outline">{t('mindgym.attention.missed', { count: result.misses })}</Badge>
            <Badge variant="outline">{t('mindgym.attention.impulseSlips', { count: result.fa })}</Badge>
          </div>
          <p className="text-xs text-foreground-subtle">Every round trains attention — there is no failing here.</p>
          <Button size="lg" onClick={begin} className="btn-aurora-primary h-12 rounded-[14px] px-6 text-[15px] font-semibold">{t('mindgym.attention.playAgain')}</Button>
        </div>
      )}
    </div>
  );
}

// ── Memory Match ──────────────────────────────────────────────────────────────
const EMOJI = ['🌟', '🌈', '🌸', '🍀', '🔆', '🌙'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MemCard { id: number; emoji: string; flipped: boolean; matched: boolean }

function makeDeck(): MemCard[] {
  return shuffle([...EMOJI, ...EMOJI]).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

function MemoryMatch() {
  const addToast = useToastStore((s) => s.addToast);
  const t = useT();
  const [cards, setCards] = useState<MemCard[]>(makeDeck);
  const [moves, setMoves] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);

  const won = cards.every((c) => c.matched);

  useEffect(() => {
    if (won) addToast({
      type: 'success',
      title: t('mindgym.memory.allMatchedTitle'),
      description: t('mindgym.memory.allMatchedDescription', { moves }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const flip = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(next);
    const newPicks = [...picks, id];
    setPicks(newPicks);
    if (newPicks.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newPicks;
      const ca = next.find((c) => c.id === a)!;
      const cb = next.find((c) => c.id === b)!;
      if (ca.emoji === cb.emoji) {
        setTimeout(() => {
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
          setPicks([]); setLocked(false);
        }, 450);
      } else {
        setTimeout(() => {
          setCards((cur) => cur.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setPicks([]); setLocked(false);
        }, 800);
      }
    }
  };

  const restart = () => { setCards(makeDeck()); setMoves(0); setPicks([]); setLocked(false); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">{t('mindgym.memory.description', { moves })}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c) => {
          const show = c.flipped || c.matched;
          return (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              className={cn(
                'grid aspect-square place-items-center rounded-[18px] border text-3xl transition-colors duration-150',
                show
                  ? 'border-primary/45 bg-surface-raised'
                  : 'border-transparent bg-primary hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]',
                c.matched && 'opacity-70 ring-2 ring-success',
              )}
              aria-label={show ? c.emoji : t('mindgym.memory.hiddenCard')}
            >
              {show ? c.emoji : <Sparkles className="h-5 w-5 text-primary-foreground/70" />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        {won ? (
          <span className="flex items-center gap-1 font-medium text-success">
            <Trophy className="h-4 w-4" /> {t('mindgym.memory.solved', { moves })}
          </span>
        ) : <span className="text-sm text-foreground-muted">{t('mindgym.memory.instruction')}</span>}
        <Button variant="outline" className="h-11 gap-2 rounded-[14px]" onClick={restart}>
          <RotateCcw className="h-4 w-4" /> {t('mindgym.memory.newGame')}
        </Button>
      </div>
    </div>
  );
}

// ── Daily Check-In ────────────────────────────────────────────────────────────
const FIELDS: { key: string; labelKey: TranslationKey; lowKey: TranslationKey; highKey: TranslationKey }[] = [
  { key: 'sleep', labelKey: 'mindgym.checkin.sleep', lowKey: 'mindgym.checkin.sleep.low', highKey: 'mindgym.checkin.sleep.high' },
  { key: 'energy', labelKey: 'mindgym.checkin.energy', lowKey: 'mindgym.checkin.energy.low', highKey: 'mindgym.checkin.energy.high' },
  { key: 'mood', labelKey: 'mindgym.checkin.mood', lowKey: 'mindgym.checkin.mood.low', highKey: 'mindgym.checkin.mood.high' },
  { key: 'focus', labelKey: 'mindgym.checkin.focus', lowKey: 'mindgym.checkin.focus.low', highKey: 'mindgym.checkin.focus.high' },
  { key: 'fog', labelKey: 'mindgym.checkin.clarity', lowKey: 'mindgym.checkin.clarity.low', highKey: 'mindgym.checkin.clarity.high' },
];

function DailyCheckIn() {
  const addToast = useToastStore((s) => s.addToast);
  const t = useT();
  const reduced = useReduced();
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, 5])));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mindgym-checkin');
      if (saved) setVals((v) => ({ ...v, ...JSON.parse(saved) }));
    } catch { /* ignore */ }
  }, []);

  const avg = FIELDS.reduce((s, f) => s + (vals[f.key] ?? 5), 0) / FIELDS.length;
  const recommendation =
    avg < 4
      ? { tone: 'gentle', title: t('mindgym.checkin.gentle.title'), text: t('mindgym.checkin.gentle.text') }
      : avg < 7
      ? { tone: 'balanced', title: t('mindgym.checkin.balanced.title'), text: t('mindgym.checkin.balanced.text') }
      : { tone: 'bright', title: t('mindgym.checkin.bright.title'), text: t('mindgym.checkin.bright.text') };

  const submit = () => {
    setSubmitted(true);
    try { localStorage.setItem('mindgym-checkin', JSON.stringify(vals)); } catch { /* ignore */ }
    addToast({ type: 'success', title: t('mindgym.checkin.savedTitle'), description: recommendation.title });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-foreground-muted">{t('mindgym.checkin.description')}</p>
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">{t(f.labelKey)}</span>
            <span className="font-mono tabular-nums text-foreground-muted">{vals[f.key]}/10</span>
          </div>
          <Slider value={[vals[f.key]]} min={1} max={10} step={1} onValueChange={(v) => { setVals((s) => ({ ...s, [f.key]: v[0] })); setSubmitted(false); }} />
          <div className="flex justify-between text-xs uppercase tracking-wider text-foreground-subtle">
            <span>{t(f.lowKey)}</span><span>{t(f.highKey)}</span>
          </div>
        </div>
      ))}

      <Button className="btn-aurora-primary h-12 w-full rounded-[14px] text-[15px] font-semibold" onClick={submit}>
        {t('mindgym.checkin.save')}
      </Button>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.14 : DURATION.standard, ease: EASE.careOut }}
            className="space-y-1 rounded-[18px] bg-secondary-soft p-4"
          >
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-secondary" /> {recommendation.title}
            </div>
            <p className="text-sm text-foreground-muted">{recommendation.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
