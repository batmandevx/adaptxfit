'use client';

/**
 * Live Coach — the flagship Guided Movement Studio (live-coach.md).
 *
 * Real-time camera rep counter and form feedback using on-device pose
 * estimation (MediaPipe Pose). All processing stays in the browser — no
 * frames ever leave the device. The MediaPipe modules are imported lazily
 * inside the browser (never at module scope) so this component is safe for
 * server rendering / static builds.
 *
 * Visual system: Clinical Aurora. The camera view is a guided alignment
 * stage — framing halo, luminous pose constellation, one clear cue at a
 * time — with a sticky session control bar and a calm coach panel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera as CameraIcon,
  Video,
  VideoOff,
  Play,
  Square,
  RotateCcw,
  ScanSearch,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle2,
  Dumbbell,
  Pause,
  Headphones,
  Settings2,
  SkipForward,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
  DURATION,
} from '@/components/ui/aurora';
import { cn } from '@/lib/utils';
import { useToastStore } from './toast-provider';
import { announce } from '@/voice/announcer';
import { useCommander } from '@/voice/use-commander';
import { useI18n } from '@/lib/i18n';

// ── Pose landmark indices (BlazePose / MediaPipe Pose, 33 points) ─────────────
const L = {
  Lshoulder: 11, Rshoulder: 12,
  Lelbow: 13, Relbow: 14,
  Lwrist: 15, Rwrist: 16,
  Lhip: 23, Rhip: 24,
  Lknee: 25, Rknee: 26,
  Lankle: 27, Rankle: 28,
} as const;

type Difficulty = 'easy' | 'normal' | 'strict';
const ROM: Record<Difficulty, number> = { easy: 0.7, normal: 1, strict: 1.2 };

interface ExerciseDef {
  id: string;
  name: string;
  joints: [number, number, number];
  up: number;
  down: number;
  cue: string;
  lowMsg: string;
  goodMsg: string;
  muscle: string;
  seated: boolean;
}

const EXERCISES: ExerciseDef[] = [
  {
    id: 'curl', name: 'Bicep Curl', joints: [L.Lshoulder, L.Lelbow, L.Lwrist],
    up: 150, down: 55, cue: 'Keep your elbow tucked in and curl your hand up toward your shoulder.',
    lowMsg: 'Curl all the way up', goodMsg: 'Full curl, great!', muscle: 'Biceps', seated: true,
  },
  {
    id: 'press', name: 'Shoulder Press', joints: [L.Lshoulder, L.Lelbow, L.Lwrist],
    up: 160, down: 80, cue: 'Start with hands at your shoulders, then press straight up overhead.',
    lowMsg: 'Press all the way up', goodMsg: 'Locked out, perfect!', muscle: 'Shoulders & triceps', seated: true,
  },
  {
    id: 'raise', name: 'Lateral Raise', joints: [L.Lhip, L.Lshoulder, L.Lelbow],
    up: 90, down: 20, cue: 'Keep arms straight and raise them out to your sides up to shoulder height.',
    lowMsg: 'Raise arms higher', goodMsg: 'Shoulder height, good!', muscle: 'Side deltoids', seated: true,
  },
  {
    id: 'squat', name: 'Squat', joints: [L.Lhip, L.Lknee, L.Lankle],
    up: 160, down: 100, cue: 'Stand tall, then bend your knees and lower your hips like sitting in a chair.',
    lowMsg: 'Go a little lower', goodMsg: 'Nice depth!', muscle: 'Quads, glutes & hamstrings', seated: false,
  },
];

// Type kept intentionally loose: MediaPipe ships its own runtime shapes.
interface Landmark { x: number; y: number; z: number; visibility?: number }

function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y) || 1e-6;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

type Status = 'idle' | 'loading' | 'tracking' | 'error';

const REP_TARGET = 12;

/** Form-score status copy per live-coach.md §5.2 */
function formStatus(score: number): { text: string; className: string } {
  if (score >= 90) return { text: 'Excellent alignment', className: 'text-primary' };
  if (score >= 75) return { text: 'Good control', className: 'text-secondary' };
  if (score >= 55) return { text: 'Small adjustment needed', className: 'text-warning' };
  return { text: 'Pause and reset', className: 'text-danger' };
}

/** Concentric framing halo shown on the camera stage (live-coach.md §4.3). */
function FramingHalo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className={className}>
      <circle cx="200" cy="200" r="176" stroke="#59E3A9" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="136" stroke="#63D6C5" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="3 10" />
      <circle cx="200" cy="200" r="96" stroke="#59E3A9" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M200 12v40M200 348v40M12 200h40M348 200h40" stroke="#63D6C5" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 92V60h32M340 60h-32v32M340 308v32h-32M60 276v32h32" stroke="#59E3A9" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 56px L-shaped safe-zone corner stroke (live-coach.md §4.3). */
function CornerBracket({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute h-14 w-14 border-primary/45',
        className,
      )}
    />
  );
}

export default function LiveCoach() {
  const addToast = useToastStore((s) => s.addToast);
  const reduced = useReduced();

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState('curl');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  // Voice cues default on when audio-only mode was persisted (see below).
  const [voiceOn, setVoiceOn] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('adaptifit-audio-only-coach') === 'true',
  );
  const [paused, setPaused] = useState(false);
  // Audio-only coaching: camera keeps running but nothing visual is required —
  // every cue is spoken and mirrored to the screen-reader live region, and a
  // large-text summary replaces the video stage (persisted per device).
  const [audioOnly, setAudioOnly] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('adaptifit-audio-only-coach') === 'true',
  );

  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [angle, setAngle] = useState(0);
  const [phase, setPhase] = useState<'up' | 'down'>('up');
  const [feedback, setFeedback] = useState('Pick an exercise and press Start.');
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'good' | 'warn'>('info');
  const [repPulse, setRepPulse] = useState(0);
  const [personDetected, setPersonDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable tracking state kept in refs so the 30fps pose loop never forces a re-render.
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const drawRef = useRef<any>(null);
  const repsRef = useRef(0);
  const phaseRef = useRef<'up' | 'down'>('up');
  const formRef = useRef(100);
  const bottomRef = useRef(999);
  const angleRef = useRef(0);
  const exerciseRef = useRef(exerciseId);
  const difficultyRef = useRef(difficulty);
  const voiceRef = useRef(voiceOn);
  const pausedRef = useRef(paused);
  const statusRef = useRef(status);
  const audioOnlyRef = useRef(audioOnly);
  const personRef = useRef(false);
  const lastSpokenRef = useRef('');
  const lastVisibilityWarnRef = useRef(0);

  useEffect(() => { exerciseRef.current = exerciseId; }, [exerciseId]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { voiceRef.current = voiceOn; }, [voiceOn]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { audioOnlyRef.current = audioOnly; }, [audioOnly]);
  useEffect(() => {
    try { localStorage.setItem('adaptifit-audio-only-coach', String(audioOnly)); } catch { /* noop */ }
  }, [audioOnly]);

  // Audio-only mode guarantees spoken coaching even if voice cues were off.
  const toggleAudioOnly = useCallback((value: boolean) => {
    setAudioOnly(value);
    if (value) setVoiceOn(true);
  }, []);

  const currentExercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0];

  // All coaching speech flows through the Voice Commander announcer: the
  // aria-live region updates for screen-reader users even when spoken cues are
  // off, and speech output shares the commander's cancel-on-new-command queue.
  // Multilingual coaching (Pillar B): spoken cues use the i18n dictionaries for
  // non-English locales; English keeps the original per-exercise cue text.
  const { t, locale } = useI18n();
  const tRef = useRef(t);
  const localeRef = useRef(locale);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { localeRef.current = locale; }, [locale]);

  const say = useCallback((text: string) => {
    lastSpokenRef.current = text;
    announce(text, { speak: voiceRef.current, force: true, interrupt: true });
  }, []);

  const setPausedState = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPaused(value);
  }, []);

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== (video.videoWidth || 640)) canvas.width = video.videoWidth || 640;
    if (canvas.height !== (video.videoHeight || 480)) canvas.height = video.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lm: Landmark[] | undefined = results?.poseLandmarks;

    // Frame-presence drives the framing halo / safe-zone corner overlays.
    const detected = !!lm;
    if (detected !== personRef.current) {
      personRef.current = detected;
      setPersonDetected(detected);
    }

    if (lm && drawRef.current) {
      const { drawConnectors, drawLandmarks, POSE_CONNECTIONS } = drawRef.current;
      // Clinical Aurora pose constellation (live-coach.md §4.4): luminous
      // emerald connectors/joints with a soft glow for visibility over video.
      ctx.shadowColor = 'rgba(89,227,169,0.34)';
      ctx.shadowBlur = 10;
      drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: 'rgba(89,227,169,0.86)', lineWidth: 3 });
      drawLandmarks(ctx, lm, { color: '#59E3A9', fillColor: '#59E3A9', lineWidth: 1, radius: 5 });
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    if (!lm) return;

    // Voice "pause" — keep the camera + skeleton running, freeze the coaching.
    if (pausedRef.current) return;

    const ex = EXERCISES.find((e) => e.id === exerciseRef.current) ?? EXERCISES[0];
    const [ia, ib, ic] = ex.joints;
    const a = lm[ia], b = lm[ib], c = lm[ic];
    if (!a || !b || !c || (a.visibility ?? 0) < 0.5 || (b.visibility ?? 0) < 0.5) {
      setFeedback('Move into the frame — your full shoulders and hips should be visible.');
      setFeedbackTone('warn');
      // Throttled so the screen-reader live region is not spammed every frame.
      const now = Date.now();
      if (now - lastVisibilityWarnRef.current > 5000) {
        lastVisibilityWarnRef.current = now;
        announce('Step back so the joint is visible to the camera.', {
          speak: audioOnlyRef.current,
          force: true,
          interrupt: false,
        });
      }
      return;
    }

    const ang = Math.round(angleBetween(a, b, c));
    angleRef.current = ang;

    const tol = ROM[difficultyRef.current];
    const downT = ex.down * tol;
    const upT = ex.up;
    if (ang < bottomRef.current) bottomRef.current = ang;

    if (phaseRef.current === 'up' && ang < downT) {
      phaseRef.current = 'down';
      bottomRef.current = ang;
      setPhase('down');
      setFeedback('Hold… now return to the top.');
      setFeedbackTone('info');
    } else if (phaseRef.current === 'down' && ang > upT) {
      phaseRef.current = 'up';
      setPhase('up');
      repsRef.current += 1;
      const full = bottomRef.current <= ex.down;
      formRef.current = Math.max(40, Math.min(100, formRef.current + (full ? 2 : -8)));
      bottomRef.current = 999;
      setReps(repsRef.current);
      setFormScore(formRef.current);
      setRepPulse((k) => k + 1);
      if (full) {
        setFeedback(`Rep ${repsRef.current} · ${ex.goodMsg}`);
        setFeedbackTone('good');
        say(localeRef.current === 'en'
          ? `Rep ${repsRef.current}. ${ex.goodMsg}`
          : `${tRef.current('liveCoach.cue.rep', { count: repsRef.current })}. ${tRef.current('liveCoach.cue.repComplete')}`);
      } else {
        setFeedback(`Rep ${repsRef.current} · ${ex.lowMsg} next time.`);
        setFeedbackTone('warn');
        say(localeRef.current === 'en'
          ? `Rep ${repsRef.current}. ${ex.lowMsg}.`
          : `${tRef.current('liveCoach.cue.rep', { count: repsRef.current })}. ${tRef.current('liveCoach.form.slowDown')}`);
      }
    }
  }, [say]);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus('loading');
    setErrorMsg(null);
    setFeedback('Preparing movement tracking…');
    setFeedbackTone('info');
    try {
      // Browser-only lazy imports keep this component build/SSR safe.
      const poseMod: any = await import('@mediapipe/pose');
      const drawMod: any = await import('@mediapipe/drawing_utils');
      const camMod: any = await import('@mediapipe/camera_utils');

      drawRef.current = {
        drawConnectors: drawMod.drawConnectors,
        drawLandmarks: drawMod.drawLandmarks,
        POSE_CONNECTIONS: poseMod.POSE_CONNECTIONS,
      };

      const pose = new poseMod.Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onResults);
      poseRef.current = pose;

      const video = videoRef.current;
      if (!video) throw new Error('Video element unavailable.');

      const camera = new camMod.Camera(video, {
        onFrame: async () => {
          if (poseRef.current) await poseRef.current.send({ image: video });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();

      setStatus('tracking');
      const ex = EXERCISES.find((e) => e.id === exerciseRef.current) ?? EXERCISES[0];
      setFeedback(ex.cue);
      setFeedbackTone('info');
      say(localeRef.current === 'en'
        ? ex.cue
        : tRef.current('liveCoach.cue.start', { exercise: ex.name }));
      addToast({ type: 'success', title: 'Live Coach ready', description: 'Move into frame to begin counting reps.' });
    } catch (err: any) {
      const message =
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access and try again.'
          : 'Could not start the camera or pose model. Check your camera and connection.';
      setErrorMsg(message);
      setStatus('error');
      setFeedback(message);
      setFeedbackTone('warn');
    }
  }, [onResults, say, addToast]);

  const stop = useCallback(() => {
    try { cameraRef.current?.stop?.(); } catch { /* noop */ }
    try { poseRef.current?.close?.(); } catch { /* noop */ }
    cameraRef.current = null;
    poseRef.current = null;
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (video) video.srcObject = null;
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    personRef.current = false;
    setPersonDetected(false);
    if (status === 'tracking') {
      addToast({ type: 'info', title: 'Session ended', description: `You completed ${repsRef.current} reps. Great work!` });
      announce(localeRef.current === 'en'
        ? `Session ended. You completed ${repsRef.current} reps. Great work!`
        : `${tRef.current('liveCoach.cue.sessionComplete')} ${tRef.current('liveCoach.cue.rep', { count: repsRef.current })}.`, {
        speak: voiceRef.current,
        force: true,
      });
    }
    setPausedState(false);
    setStatus('idle');
    setPhase('up');
    setFeedback('Session stopped. Press Start to go again.');
    setFeedbackTone('info');
  }, [status, addToast, setPausedState]);

  const pauseSession = useCallback(() => {
    if (statusRef.current !== 'tracking' || pausedRef.current) return;
    setPausedState(true);
    setFeedback('Paused. Say "resume" or press Resume to continue.');
    setFeedbackTone('info');
    say('Session paused. Say resume when you are ready to continue.');
  }, [setPausedState, say]);

  const resumeSession = useCallback(() => {
    if (!pausedRef.current) return;
    setPausedState(false);
    const ex = EXERCISES.find((e) => e.id === exerciseRef.current) ?? EXERCISES[0];
    setFeedback(ex.cue);
    setFeedbackTone('info');
    say(`Resuming ${ex.name}. ${ex.cue}`);
  }, [setPausedState, say]);

  /** Voice "next exercise" — cycle the movement and reset the counters. */
  const nextExercise = useCallback(() => {
    const idx = EXERCISES.findIndex((e) => e.id === exerciseRef.current);
    const next = EXERCISES[(idx + 1) % EXERCISES.length];
    setExerciseId(next.id);
    exerciseRef.current = next.id;
    repsRef.current = 0;
    phaseRef.current = 'up';
    formRef.current = 100;
    bottomRef.current = 999;
    setReps(0);
    setFormScore(100);
    setPhase('up');
    setFeedback(next.cue);
    setFeedbackTone('info');
    say(`Next exercise: ${next.name}. ${next.cue}`);
  }, [say]);

  /** Voice "repeat that" — re-speak the last cue/instruction verbatim. */
  const repeatCue = useCallback(() => {
    const ex = EXERCISES.find((e) => e.id === exerciseRef.current) ?? EXERCISES[0];
    const last = lastSpokenRef.current || ex.cue;
    // Force speech even if voice cues are off: the user explicitly asked.
    announce(last, { speak: true, force: true, interrupt: true });
  }, []);

  const reset = useCallback(() => {
    repsRef.current = 0;
    phaseRef.current = 'up';
    formRef.current = 100;
    bottomRef.current = 999;
    setReps(0);
    setFormScore(100);
    setPhase('up');
    setFeedback('Counters reset.');
    setFeedbackTone('info');
  }, []);

  // ── Voice Commander session controls (hands-free) ──────────────────────────
  // Registering here makes "start workout" / "next exercise" / "stop" / "pause"
  // / "repeat that" drive this component. If the user issues a session command
  // from another section, the provider navigates here and replays the intent as
  // soon as these handlers register.
  const startActionRef = useRef(start);
  const stopActionRef = useRef(stop);
  useEffect(() => { startActionRef.current = start; }, [start]);
  useEffect(() => { stopActionRef.current = stop; }, [stop]);

  const commander = useCommander();
  const registerHandler = commander?.registerHandler;
  useEffect(() => {
    if (!registerHandler) return;
    const idleMessage = 'There is no active session. Say "start workout" to begin one.';
    const unsubs = [
      registerHandler('session.start', () => {
        if (pausedRef.current) resumeSession();
        else if (statusRef.current === 'idle' || statusRef.current === 'error') {
          void startActionRef.current();
        }
        // Already tracking/loading: the spoken confirmation is accurate as-is.
      }),
      registerHandler('session.pause', () => {
        if (statusRef.current === 'tracking' && !pausedRef.current) pauseSession();
        else if (statusRef.current !== 'tracking') {
          announce(idleMessage, { speak: true, force: true });
        }
      }),
      registerHandler('session.stop', () => {
        if (statusRef.current === 'tracking' || statusRef.current === 'loading') {
          stopActionRef.current();
        } else {
          announce(idleMessage, { speak: true, force: true });
        }
      }),
      registerHandler('session.next', () => nextExercise()),
      registerHandler('session.repeat', () => repeatCue()),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [registerHandler, pauseSession, resumeSession, nextExercise, repeatCue]);

  // Low-frequency mirror of the live angle into state (keeps the readout smooth
  // without re-rendering on every camera frame).
  useEffect(() => {
    if (status !== 'tracking') return;
    const id = setInterval(() => setAngle(angleRef.current), 150);
    return () => clearInterval(id);
  }, [status]);

  // Cleanup on unmount.
  useEffect(() => () => {
    try { cameraRef.current?.stop?.(); } catch { /* noop */ }
    try { poseRef.current?.close?.(); } catch { /* noop */ }
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const toneClass =
    feedbackTone === 'good'
      ? 'text-success'
      : feedbackTone === 'warn'
        ? 'text-warning'
        : 'text-foreground';

  const statusPill =
    status === 'tracking'
      ? paused
        ? { label: 'Paused', icon: <Pause className="h-3.5 w-3.5" />, cls: 'bg-warning-soft text-warning' }
        : { label: 'Tracking', icon: <ScanSearch className="h-3.5 w-3.5" />, cls: 'bg-primary-soft text-primary' }
      : status === 'loading'
        ? { label: 'Preparing', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: 'bg-info-soft text-info' }
        : status === 'error'
          ? { label: 'Camera off', icon: <VideoOff className="h-3.5 w-3.5" />, cls: 'bg-surface-raised text-foreground-muted' }
          : { label: 'Ready', icon: <CameraIcon className="h-3.5 w-3.5" />, cls: 'bg-info-soft text-info' };

  const form = formStatus(formScore);
  const setProgress = Math.min(100, (reps / REP_TARGET) * 100);

  // Accessible text alternative for the camera stage (live-coach.md §8).
  const stageSummary = `${currentExercise.name}. ${reps} repetitions. ${
    status === 'tracking' ? (paused ? 'Session paused.' : 'Tracking active.') : 'Camera off.'
  } ${feedback}`;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <SectionHeader
        eyebrow="LIVE COACH"
        title="Guided Movement Studio"
        description="Camera-guided form support with voice feedback. Video stays on this device unless you choose to save a session."
        actions={
          <>
            <span
              role="status"
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-150',
                statusPill.cls,
              )}
            >
              {statusPill.icon}
              {statusPill.label}
            </span>
            {status === 'tracking' && (
              <Button
                variant="outline"
                onClick={stop}
                className="h-12 gap-2 rounded-[14px] border-danger/60 px-5 text-danger hover:bg-danger-soft"
              >
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── Camera / pose stage ─────────────────────────────────────────── */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: reduced ? 0.14 : 0.52, ease: EASE.careOut }}
          className={cn(audioOnly ? 'sr-only' : 'lg:col-span-8')}
          aria-hidden={audioOnly}
        >
          <div
            className={cn(
              'relative aspect-[4/5] w-full overflow-hidden rounded-[32px] border border-border-strong sm:aspect-[4/3] sm:min-h-[520px] lg:min-h-[620px]',
              status !== 'tracking' &&
                'bg-[linear-gradient(180deg,var(--surface-raised),var(--background))]',
              status === 'tracking' && 'bg-black',
            )}
            style={
              status === 'tracking'
                ? { boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)' }
                : { boxShadow: 'var(--shadow-lg)' }
            }
          >
            {/* Camera layer (mirrored front-camera view) */}
            <video
              ref={videoRef}
              className={cn(
                'absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-300',
                paused && 'opacity-60',
              )}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={cn(
                'absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-300',
                paused && 'opacity-60',
              )}
            />
            {/* Readability scrim over video */}
            {status === 'tracking' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.24))]"
              />
            )}

            {/* Framing halo — prominent without a body, faint while tracking */}
            {(status === 'tracking' || status === 'loading') && (
              <FramingHalo
                className={cn(
                  'pointer-events-none absolute left-1/2 top-1/2 h-[72%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500',
                  status === 'tracking' && personDetected ? 'opacity-[0.14]' : 'opacity-[0.32]',
                )}
              />
            )}

            {/* Safe-zone corners once a body is detected */}
            {status === 'tracking' && personDetected && !paused && (
              <>
                <CornerBracket className="left-6 top-6 rounded-tl-lg border-l-2 border-t-2" />
                <CornerBracket className="right-6 top-6 rounded-tr-lg border-r-2 border-t-2" />
                <CornerBracket className="bottom-6 left-6 rounded-bl-lg border-b-2 border-l-2" />
                <CornerBracket className="bottom-6 right-6 rounded-br-lg border-b-2 border-r-2" />
              </>
            )}

            {/* Mirrored-view label */}
            {status === 'tracking' && (
              <span className="glass-overlay absolute bottom-6 right-6 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted">
                Mirrored view
              </span>
            )}

            {/* Live feedback chips — top-left */}
            {status === 'tracking' && (
              <div className="absolute left-6 top-6 flex max-w-[420px] flex-col items-start gap-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={feedback}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduced ? 0.14 : 0.18, ease: EASE.careOut }}
                    className="glass-overlay flex min-h-12 items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    {feedbackTone === 'good' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : feedbackTone === 'warn' ? (
                      <Info className="h-4 w-4 shrink-0 text-warning" />
                    ) : (
                      <Info className="h-4 w-4 shrink-0 text-info" />
                    )}
                    <span className={cn('text-base font-semibold', toneClass)}>{feedback}</span>
                  </motion.div>
                </AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  <span className="glass-overlay inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
                    Form <span className={cn('font-mono', form.className)}>{formScore}%</span>
                  </span>
                  <span className="glass-overlay inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-muted">
                    {paused ? 'Session paused' : 'Tracking active'}
                  </span>
                </div>
              </div>
            )}

            {/* Exercise chip — top-right */}
            {status === 'tracking' && (
              <div className="glass-overlay absolute right-6 top-6 rounded-2xl px-4 py-2.5 text-right">
                <p className="text-sm font-semibold text-foreground">{currentExercise.name}</p>
                <p className="font-mono text-xs text-foreground-muted">
                  Rep {reps} · Phase {phase} · {angle}°
                </p>
              </div>
            )}

            {/* Rep counter pulse — bottom-left */}
            {status === 'tracking' && (
              <motion.div
                key={repPulse}
                initial={reduced ? false : { scale: 1 }}
                animate={reduced ? {} : { scale: [1, 1.12, 1] }}
                transition={{ duration: 0.4 }}
                className="glass-overlay absolute bottom-6 left-6 rounded-2xl px-4 py-2"
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
                  Reps
                </span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{reps}</span>
              </motion.div>
            )}

            {/* ── State overlays ── */}
            {status === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-soft">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Enable your camera for form guidance
                  </h3>
                  <p className="mx-auto max-w-sm text-sm leading-6 text-foreground-muted">
                    AdaptiFit uses your camera only for this session. Video stays on this device
                    unless you choose to save a session.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={start}
                    className="btn-aurora-primary h-12 gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                  >
                    <CameraIcon className="h-4 w-4" /> Enable camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleAudioOnly(true)}
                    className="h-12 gap-2 rounded-[14px] px-5"
                  >
                    <Headphones className="h-4 w-4" /> Continue without camera
                  </Button>
                </div>
                <p className="text-xs text-foreground-subtle">
                  Privacy: video is processed locally and never uploaded.
                </p>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
                <FramingHalo className="h-32 w-32 opacity-40" />
                <div className="space-y-1.5">
                  <p className="flex items-center justify-center gap-2 text-base font-semibold text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Preparing movement tracking…
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">Camera</span>
                    <span aria-hidden="true">→</span>
                    <span className="rounded-full bg-surface-raised px-2.5 py-1 font-medium">Body model</span>
                    <span aria-hidden="true">→</span>
                    <span className="rounded-full bg-surface-raised px-2.5 py-1 font-medium">Coach cues</span>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-danger-soft">
                  <VideoOff className="h-8 w-8 text-danger" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Camera access is unavailable
                  </h3>
                  <p className="mx-auto max-w-sm text-sm leading-6 text-foreground-muted">
                    {errorMsg} You can still follow the guided exercise with voice and text cues.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={start}
                    className="btn-aurora-primary h-12 gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                  >
                    <RotateCcw className="h-4 w-4" /> Try again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleAudioOnly(true)}
                    className="h-12 gap-2 rounded-[14px] px-5"
                  >
                    <Headphones className="h-4 w-4" /> Continue without camera
                  </Button>
                </div>
              </div>
            )}

            {/* Paused overlay */}
            {status === 'tracking' && paused && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-sm">
                <p className="font-display text-2xl font-semibold text-foreground">Session paused</p>
                <div className="flex gap-3">
                  <Button
                    onClick={resumeSession}
                    className="btn-aurora-primary h-12 gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                  >
                    <Play className="h-4 w-4" /> Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stop}
                    className="h-12 gap-2 rounded-[14px] border-danger/60 px-5 text-danger hover:bg-danger-soft"
                  >
                    <Square className="h-4 w-4" /> End session
                  </Button>
                </div>
              </div>
            )}

            {/* Accessible text alternative for the camera stage */}
            <p className="sr-only" role="status">
              {stageSummary}
            </p>
          </div>
        </motion.div>

        {/* Audio-only coaching summary — replaces the visual stage. Large,
            high-contrast text for low-vision users; blind users get the same
            information through the spoken cues + announcer live region. */}
        {audioOnly && (
          <GlassPanel className="lg:col-span-8 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-soft">
                <Headphones className="h-7 w-7 text-secondary" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">Audio-only coaching</h3>
                <p className="text-sm text-foreground-muted">
                  Every cue is spoken aloud and announced to your screen reader — no need to watch the screen.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="font-display text-2xl font-semibold text-foreground">{currentExercise.name}</p>
              <p className="font-mono text-7xl font-semibold tabular-nums leading-none text-primary">{reps}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">repetitions</p>
              <p className="text-xl font-medium capitalize text-foreground">
                {status === 'tracking' ? (paused ? 'Paused' : phase) : 'Camera off'}
              </p>
              <p className={cn('max-w-md text-lg font-medium', toneClass)}>{feedback}</p>
              {status !== 'tracking' && status !== 'loading' && (
                <p className="text-sm text-foreground-muted">
                  Press Start below — or just say &quot;start workout&quot;.
                </p>
              )}
            </div>
          </GlassPanel>
        )}

        {/* ── Coach panel ─────────────────────────────────────────────────── */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduced ? 0.14 : DURATION.expressive, delay: reduced ? 0 : 0.12, ease: EASE.careOut }}
          className="space-y-4 lg:col-span-4 lg:max-h-[calc(100svh-176px)] lg:overflow-y-auto lg:pr-1"
        >
          {/* Current exercise */}
          <GlassPanel className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
                <Dumbbell className="h-7 w-7 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold text-foreground">{currentExercise.name}</h3>
                <p className="text-sm text-foreground-muted">
                  {currentExercise.muscle}
                  {currentExercise.seated ? ' • Chair-supported' : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="font-mono text-[56px] font-semibold leading-none tabular-nums text-foreground">
                {reps}
                <span className="text-xl text-foreground-subtle">/{REP_TARGET}</span>
              </p>
              <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary">
                Tempo steady
              </span>
            </div>
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-xs text-foreground-subtle">
                <span>Set progress</span>
                <span>{Math.min(reps, REP_TARGET)} of {REP_TARGET} reps</span>
              </div>
              <Progress value={setProgress} className="h-2.5" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground" htmlFor="lc-exercise">Exercise</label>
                <Select value={exerciseId} onValueChange={setExerciseId}>
                  <SelectTrigger id="lc-exercise" className="h-12 rounded-[14px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXERCISES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.seated ? ' · seated-friendly' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground" htmlFor="lc-rom">Range of motion</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger id="lc-rom" className="h-12 rounded-[14px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Accessible (counts a gentle range)</SelectItem>
                    <SelectItem value="normal">Standard</SelectItem>
                    <SelectItem value="strict">Strict (full depth required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassPanel>

          {/* Form score */}
          <GlassPanel className="p-5">
            <div className="flex items-center gap-5">
              <div className="relative h-[132px] w-[132px] shrink-0">
                <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
                  <circle cx="66" cy="66" r="56" fill="none" strokeWidth="10" className="stroke-border/45" />
                  <motion.circle
                    cx="66" cy="66" r="56" fill="none" strokeWidth="10" strokeLinecap="round"
                    className={cn(
                      formScore >= 90 ? 'stroke-primary'
                        : formScore >= 75 ? 'stroke-secondary'
                          : formScore >= 55 ? 'stroke-warning' : 'stroke-danger',
                    )}
                    strokeDasharray={2 * Math.PI * 56}
                    initial={false}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - formScore / 100) }}
                    transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE.careOut }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{formScore}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">Form score</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold', form.className)}>{form.text}</p>
                <p className="mt-1 text-xs leading-5 text-foreground-subtle">
                  Form score is a guide. Comfort and safety matter more than perfection.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[14px] bg-info-soft p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-info">Last cue</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={feedback}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.12 : 0.16 }}
                  className="mt-1 text-sm font-medium text-foreground"
                >
                  {feedback}
                </motion.p>
              </AnimatePresence>
            </div>
          </GlassPanel>

          {/* Coaching cues */}
          <GlassPanel className="p-5">
            <h3 className="text-lg font-semibold text-foreground">Coaching cue</h3>
            <p className="mt-1 text-[15px] leading-[26px] text-foreground-muted">{currentExercise.cue}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={repeatCue} className="h-11 gap-2 rounded-[14px]">
                <Volume2 className="h-4 w-4" /> Repeat aloud
              </Button>
              <Button variant="ghost" onClick={nextExercise} className="h-11 gap-2 rounded-[14px] text-primary hover:bg-primary-soft">
                <SkipForward className="h-4 w-4" /> Show alternative
              </Button>
            </div>
          </GlassPanel>

          {/* Voice feedback */}
          <GlassPanel className="p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Settings2 className="h-5 w-5 text-foreground-muted" /> Session settings
            </h3>
            <div className="mt-3 space-y-3">
              <div className="flex min-h-14 items-center justify-between gap-3 rounded-[14px] border border-border/60 p-3">
                <label htmlFor="voice-cues" className="flex items-start gap-2.5 cursor-pointer">
                  <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Voice coaching</span>
                    <span className="block text-xs text-foreground-muted">Spoken cues as you move</span>
                  </span>
                </label>
                <Switch
                  id="voice-cues"
                  checked={voiceOn}
                  onCheckedChange={setVoiceOn}
                  aria-label="Toggle voice coaching"
                />
              </div>
              <div className="flex min-h-14 items-center justify-between gap-3 rounded-[14px] border border-border/60 p-3">
                <label htmlFor="audio-only-mode" className="flex items-start gap-2.5 cursor-pointer">
                  <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Audio-only mode</span>
                    <span className="block text-xs text-foreground-muted">
                      No screen needed — every cue is spoken and screen-reader announced.
                    </span>
                  </span>
                </label>
                <Switch
                  id="audio-only-mode"
                  checked={audioOnly}
                  onCheckedChange={toggleAudioOnly}
                  aria-label="Toggle audio-only coaching mode"
                />
              </div>
              <p className="text-xs leading-5 text-foreground-subtle">
                Hands-free: say &quot;start workout&quot;, &quot;next exercise&quot;, &quot;pause&quot;,
                &quot;repeat that&quot; or &quot;stop&quot; with the microphone on.
              </p>
            </div>
          </GlassPanel>

          <p className="px-2 text-center text-xs text-foreground-subtle">
            General movement guidance only — not medical advice. Stop if you feel pain, dizziness
            or discomfort.
          </p>
        </motion.div>
      </div>

      {/* ── Sticky session control bar ────────────────────────────────────── */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.14 : DURATION.page, delay: reduced ? 0 : 0.2, ease: EASE.careOut }}
        className="sticky bottom-[calc(12px+env(safe-area-inset-bottom))] z-30 sm:bottom-6"
      >
        <div className="glass-overlay flex flex-wrap items-center gap-3 rounded-[32px] p-3">
          <div className="hidden min-w-[180px] flex-1 items-center gap-3 pl-2 md:flex">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{currentExercise.name}</p>
              <p className="text-xs text-foreground-muted">{reps} reps · form {formScore}%</p>
            </div>
            <Progress value={setProgress} className="h-2 min-w-[120px] flex-1" />
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:flex-initial">
            {status === 'tracking' ? (
              <Button
                onClick={paused ? resumeSession : pauseSession}
                aria-pressed={paused}
                className="btn-aurora-primary h-14 min-w-[152px] gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
              >
                {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                {paused ? 'Resume' : 'Pause'}
              </Button>
            ) : (
              <Button
                onClick={start}
                disabled={status === 'loading'}
                className="btn-aurora-primary h-14 min-w-[152px] gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
              >
                {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {status === 'loading' ? 'Preparing…' : 'Start guided session'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={nextExercise}
              className="h-[52px] gap-2 rounded-[14px] px-4"
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">Next exercise</span>
              <span className="sr-only sm:hidden">Next exercise</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceOn((v) => !v)}
              className={cn('h-[52px] w-[52px] rounded-[14px]', voiceOn && 'bg-secondary-soft text-secondary')}
              aria-label={voiceOn ? 'Turn voice cues off' : 'Turn voice cues on'}
              aria-pressed={voiceOn}
            >
              {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={status === 'tracking' ? stop : start}
              disabled={status === 'loading'}
              className="h-[52px] w-[52px] rounded-[14px]"
              aria-label={status === 'tracking' ? 'Turn camera off' : 'Turn camera on'}
            >
              {status === 'tracking' ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="h-[52px] gap-2 rounded-[14px] px-4"
              aria-label="Reset rep counters"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            {(status === 'tracking' || status === 'loading') && (
              <Button
                variant="outline"
                onClick={stop}
                className="h-[52px] gap-2 rounded-[14px] border-danger/60 px-4 text-danger hover:bg-danger-soft"
              >
                <Square className="h-4 w-4" /> End
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
