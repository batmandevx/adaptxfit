'use client';

/**
 * Mind Gym — a cognitive training hub merged from the "MindGym" project.
 *
 * Brings MindGym's brain-training exercises into the unified AdaptiFit app:
 *  - Focus Timer (ADHD / focus): a gentle Pomodoro with body-doubling encouragement.
 *  - Attention Game (Go / No-Go): trains sustained attention & impulse control.
 *  - Memory Match: a working-memory pairs game.
 *  - Daily Check-In (brain fog): adapts a gentle recommendation to how today feels.
 *
 * Everything runs locally in the browser — nothing is uploaded.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
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
import { Slider } from '@/components/ui/slider';
import { useToastStore } from './toast-provider';

type GameId = 'hub' | 'focus' | 'attention' | 'memory' | 'checkin';

interface GameMeta {
  id: Exclude<GameId, 'hub'>;
  name: string;
  area: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const GAMES: GameMeta[] = [
  { id: 'focus', name: 'Focus Timer', area: 'ADHD · Focus', description: 'A calm Pomodoro with encouragement to start and keep going.', icon: <Timer className="w-6 h-6" />, gradient: 'from-amber-500 to-orange-600' },
  { id: 'attention', name: 'Attention Game', area: 'ADHD · Impulse control', description: 'Tap on GO, hold back on STOP. Trains sustained attention.', icon: <Target className="w-6 h-6" />, gradient: 'from-rose-500 to-pink-600' },
  { id: 'memory', name: 'Memory Match', area: 'Memory', description: 'Flip cards and find the matching pairs from memory.', icon: <Grid3x3 className="w-6 h-6" />, gradient: 'from-violet-500 to-purple-600' },
  { id: 'checkin', name: 'Daily Check-In', area: 'Brain fog', description: 'A 20-second check-in that tailors a gentle suggestion to today.', icon: <HeartPulse className="w-6 h-6" />, gradient: 'from-cyan-500 to-teal-600' },
];

export default function MindGym() {
  const [game, setGame] = useState<GameId>('hub');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <Badge variant="secondary" className="gap-1">
          <Brain className="w-3.5 h-3.5" /> Cognitive training · private &amp; local
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Mind Gym</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A gentle gym for the brain — focus, attention, memory and a daily check-in. Train at your
          own pace; there is never any pressure here.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {game === 'hub' ? (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 gap-4">
            {GAMES.map((g, i) => (
              <motion.button
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setGame(g.id)}
                className="text-left"
              >
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${g.gradient} text-white grid place-items-center shadow`}>
                      {g.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{g.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{g.area}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{g.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div key={game} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" onClick={() => setGame('hub')} className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> All exercises
            </Button>
            {game === 'focus' && <FocusTimer />}
            {game === 'attention' && <AttentionGame />}
            {game === 'memory' && <MemoryMatch />}
            {game === 'checkin' && <DailyCheckIn />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Focus Timer ───────────────────────────────────────────────────────────────
function FocusTimer() {
  const addToast = useToastStore((s) => s.addToast);
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
            title: wasBreak ? 'Break over' : 'Focus block done!',
            description: wasBreak ? 'Ready for another gentle focus block?' : 'Lovely work. Take a short break.',
          });
          setOnBreak(!wasBreak);
          setRunning(false);
          return (wasBreak ? minutes : 5) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onBreak, minutes, addToast]);

  useEffect(() => {
    if (!running) setSecondsLeft((onBreak ? 5 : minutes) * 60);
  }, [minutes, onBreak, running]);

  const total = (onBreak ? 5 : minutes) * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-amber-500" /> Focus Timer</CardTitle>
        <CardDescription>{onBreak ? 'Break time — rest your mind.' : 'One small block of focus. You can do this.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative grid place-items-center py-4">
          <svg viewBox="0 0 120 120" className="w-48 h-48 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
            <motion.circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
              className={onBreak ? 'stroke-teal-500' : 'stroke-amber-500'}
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-4xl font-bold tabular-nums">{mm}:{ss}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{onBreak ? 'Break' : 'Focus'}</div>
          </div>
        </div>

        {!running && !onBreak && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Block length</span><span className="font-medium">{minutes} min</span></div>
            <Slider value={[minutes]} min={5} max={50} step={5} onValueChange={(v) => setMinutes(v[0])} />
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={() => setRunning((r) => !r)} className="gap-2 min-w-32">
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => { setRunning(false); setOnBreak(false); setSecondsLeft(minutes * 60); }}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Attention Game (Go / No-Go) ───────────────────────────────────────────────
const TOTAL_TRIALS = 20;
const STIM_MS = 850;

function AttentionGame() {
  const addToast = useToastStore((s) => s.addToast);
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
    addToast({ type: 'success', title: 'Round complete', description: `${Math.round(acc * 100)}% accuracy. Nicely focused!` });
  }, [addToast]);

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

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-rose-500" /> Attention Game</CardTitle>
        <CardDescription>Tap the shape (or press Space) on green <b>GO</b>. Do nothing on red <b>STOP</b>.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {phase === 'idle' && (
          <div className="py-10 space-y-4">
            <p className="text-muted-foreground">{TOTAL_TRIALS} quick rounds. Ready?</p>
            <Button size="lg" onClick={begin}>Start</Button>
          </div>
        )}

        {phase === 'running' && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Round {trial + 1} / {TOTAL_TRIALS}</div>
            <button onClick={respond} aria-label="Respond" className="mx-auto w-56 h-56 grid place-items-center select-none">
              <AnimatePresence mode="wait">
                {stim === 'go' && (
                  <motion.div key="go" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                    className="w-40 h-40 rounded-full bg-emerald-500 text-white grid place-items-center text-3xl font-black shadow-lg">GO</motion.div>
                )}
                {stim === 'nogo' && (
                  <motion.div key="nogo" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                    className="w-36 h-36 rounded-2xl bg-rose-500 text-white grid place-items-center text-3xl font-black shadow-lg">STOP</motion.div>
                )}
                {!stim && <motion.div key="rest" className="text-4xl text-muted-foreground">＋</motion.div>}
              </AnimatePresence>
            </button>
            <p className="text-xs text-muted-foreground">Press Space or tap when it&apos;s green.</p>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="py-6 space-y-4">
            <div className="text-5xl">{result.acc >= 0.8 ? '🌟' : result.acc >= 0.6 ? '👍' : '💪'}</div>
            <h3 className="text-2xl font-bold">{Math.round(result.acc * 100)}% accuracy</h3>
            <p className="text-muted-foreground">Average reaction time: <b>{result.avgRt || '—'} ms</b></p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">✓ {result.hits} go hits</Badge>
              <Badge variant="secondary">✓ {result.cr} correct stops</Badge>
              <Badge variant="outline">↩ {result.misses} missed</Badge>
              <Badge variant="outline">✋ {result.fa} impulse slips</Badge>
            </div>
            <Button size="lg" onClick={begin}>Play again</Button>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [cards, setCards] = useState<MemCard[]>(makeDeck);
  const [moves, setMoves] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);

  const won = cards.every((c) => c.matched);

  useEffect(() => {
    if (won) addToast({ type: 'success', title: 'All matched!', description: `Completed in ${moves} moves. Great memory!` });
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
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Grid3x3 className="w-5 h-5 text-violet-500" /> Memory Match</CardTitle>
        <CardDescription>Find all six matching pairs. Moves: <b>{moves}</b></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {cards.map((c) => {
            const show = c.flipped || c.matched;
            return (
              <button
                key={c.id}
                onClick={() => flip(c.id)}
                className={`aspect-square rounded-xl text-3xl grid place-items-center transition-all border
                  ${show ? 'bg-card border-violet-400' : 'bg-gradient-to-br from-violet-500 to-purple-600 border-transparent'}
                  ${c.matched ? 'opacity-60 ring-2 ring-emerald-400' : ''}`}
                aria-label={show ? c.emoji : 'hidden card'}
              >
                {show ? c.emoji : <Sparkles className="w-5 h-5 text-white/70" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          {won ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Trophy className="w-4 h-4" /> Solved in {moves} moves!
            </span>
          ) : <span className="text-sm text-muted-foreground">Tap two cards to compare.</span>}
          <Button variant="outline" className="gap-2" onClick={restart}><RotateCcw className="w-4 h-4" /> New game</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Daily Check-In ────────────────────────────────────────────────────────────
const FIELDS: { key: string; label: string; low: string; high: string }[] = [
  { key: 'sleep', label: 'Sleep', low: 'Poor', high: 'Great' },
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Energised' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Bright' },
  { key: 'focus', label: 'Focus', low: 'Scattered', high: 'Sharp' },
  { key: 'fog', label: 'Clarity', low: 'Foggy', high: 'Clear' },
];

function DailyCheckIn() {
  const addToast = useToastStore((s) => s.addToast);
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
      ? { tone: 'gentle', title: 'Be gentle with yourself today', text: 'Today looks like a harder day. Try the Breathing space or a short Calm session before anything demanding.' }
      : avg < 7
      ? { tone: 'balanced', title: 'A steady day', text: 'A balanced day — a single Focus block or the Attention game is a great, achievable goal.' }
      : { tone: 'bright', title: 'You\'re in a good place', text: 'Energy looks good! A great time for a Memory Match challenge or a longer focus block.' };

  const submit = () => {
    setSubmitted(true);
    try { localStorage.setItem('mindgym-checkin', JSON.stringify(vals)); } catch { /* ignore */ }
    addToast({ type: 'success', title: 'Check-in saved', description: recommendation.title });
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HeartPulse className="w-5 h-5 text-cyan-500" /> Daily Check-In</CardTitle>
        <CardDescription>How does today feel? This tailors a gentle suggestion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{f.label}</span>
              <span className="text-muted-foreground tabular-nums">{vals[f.key]}/10</span>
            </div>
            <Slider value={[vals[f.key]]} min={1} max={10} step={1} onValueChange={(v) => { setVals((s) => ({ ...s, [f.key]: v[0] })); setSubmitted(false); }} />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{f.low}</span><span>{f.high}</span>
            </div>
          </div>
        ))}

        <Button className="w-full" onClick={submit}>Save check-in</Button>

        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border bg-muted/50 p-4 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {recommendation.title}
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
