'use client';

/**
 * Live Coach — real-time camera rep counter and form feedback.
 *
 * Merged from the "AccessFit / Gym Buddy" project. Unlike the simulated Body
 * Scan, this uses genuine on-device pose estimation (MediaPipe Pose, already a
 * dependency) to measure joint angles, count repetitions and give live form
 * cues. All processing stays in the browser — no frames ever leave the device.
 *
 * The MediaPipe modules are imported lazily inside the browser (never at module
 * scope) so this component is safe for server rendering / static builds. The
 * pose model assets are fetched on demand from the public jsDelivr CDN.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera as CameraIcon,
  Play,
  Square,
  RotateCcw,
  Activity,
  Flame,
  Target,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Dumbbell,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToastStore } from './toast-provider';

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
    lowMsg: 'Curl all the way up', goodMsg: 'Full curl, great!', muscle: 'biceps', seated: true,
  },
  {
    id: 'press', name: 'Shoulder Press', joints: [L.Lshoulder, L.Lelbow, L.Lwrist],
    up: 160, down: 80, cue: 'Start with hands at your shoulders, then press straight up overhead.',
    lowMsg: 'Press all the way up', goodMsg: 'Locked out, perfect!', muscle: 'shoulders & triceps', seated: true,
  },
  {
    id: 'raise', name: 'Lateral Raise', joints: [L.Lhip, L.Lshoulder, L.Lelbow],
    up: 90, down: 20, cue: 'Keep arms straight and raise them out to your sides up to shoulder height.',
    lowMsg: 'Raise arms higher', goodMsg: 'Shoulder height, good!', muscle: 'side deltoids', seated: true,
  },
  {
    id: 'squat', name: 'Squat', joints: [L.Lhip, L.Lknee, L.Lankle],
    up: 160, down: 100, cue: 'Stand tall, then bend your knees and lower your hips like sitting in a chair.',
    lowMsg: 'Go a little lower', goodMsg: 'Nice depth!', muscle: 'quads, glutes & hamstrings', seated: false,
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

export default function LiveCoach() {
  const addToast = useToastStore((s) => s.addToast);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState('curl');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [voiceOn, setVoiceOn] = useState(false);

  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [angle, setAngle] = useState(0);
  const [phase, setPhase] = useState<'up' | 'down'>('up');
  const [feedback, setFeedback] = useState('Pick an exercise and press Start.');
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'good' | 'warn'>('info');
  const [repPulse, setRepPulse] = useState(0);

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

  useEffect(() => { exerciseRef.current = exerciseId; }, [exerciseId]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { voiceRef.current = voiceOn; }, [voiceOn]);

  const currentExercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0];

  const say = useCallback((text: string) => {
    if (!voiceRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } catch {
      /* speech is best-effort */
    }
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
    if (lm && drawRef.current) {
      const { drawConnectors, drawLandmarks, POSE_CONNECTIONS } = drawRef.current;
      drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: '#10b981', lineWidth: 3 });
      drawLandmarks(ctx, lm, { color: '#22d3ee', lineWidth: 1, radius: 3 });
    }
    ctx.restore();

    if (!lm) return;

    const ex = EXERCISES.find((e) => e.id === exerciseRef.current) ?? EXERCISES[0];
    const [ia, ib, ic] = ex.joints;
    const a = lm[ia], b = lm[ib], c = lm[ic];
    if (!a || !b || !c || (a.visibility ?? 0) < 0.5 || (b.visibility ?? 0) < 0.5) {
      setFeedback('Step back so the joint is visible to the camera.');
      setFeedbackTone('warn');
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
        say(`Rep ${repsRef.current}. ${ex.goodMsg}`);
      } else {
        setFeedback(`Rep ${repsRef.current} · ${ex.lowMsg} next time.`);
        setFeedbackTone('warn');
        say(`Rep ${repsRef.current}. ${ex.lowMsg}.`);
      }
    }
  }, [say]);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus('loading');
    setErrorMsg(null);
    setFeedback('Loading the pose model…');
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
      say(ex.cue);
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
    if (status === 'tracking') {
      addToast({ type: 'info', title: 'Session ended', description: `You completed ${repsRef.current} reps. Great work!` });
    }
    setStatus('idle');
    setPhase('up');
    setFeedback('Session stopped. Press Start to go again.');
    setFeedbackTone('info');
  }, [status, addToast]);

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
      ? 'text-emerald-600 dark:text-emerald-400'
      : feedbackTone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-foreground';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <Badge variant="secondary" className="gap-1">
          <Activity className="w-3.5 h-3.5" /> AI Form Coach · on-device
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Live Coach</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Real-time rep counting and form feedback using on-device pose estimation. Your camera
          stays on your device — no video is ever uploaded.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera stage */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black aspect-[4/3] w-full">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />

              {/* HUD */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                <motion.div
                  key={repPulse}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl bg-black/55 backdrop-blur px-4 py-2 text-white"
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/70 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Reps
                  </div>
                  <div className="text-3xl font-bold leading-none">{reps}</div>
                </motion.div>
                <div className="rounded-2xl bg-black/55 backdrop-blur px-4 py-2 text-white text-right">
                  <div className="text-[10px] uppercase tracking-wider text-white/70">Phase</div>
                  <div className="text-lg font-semibold capitalize leading-tight">{phase}</div>
                  <div className="text-[10px] text-white/70 mt-0.5">{angle}° tracked</div>
                </div>
              </div>

              {/* Status overlays */}
              {status === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-3 bg-gradient-to-b from-black/20 to-black/60">
                  <CameraIcon className="w-12 h-12" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
              {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-black/60">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-sm">Loading pose model…</p>
                </div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-black/70 px-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                  <p className="text-sm max-w-xs">{errorMsg}</p>
                </div>
              )}

              {/* Live feedback banner */}
              {status === 'tracking' && (
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 backdrop-blur px-4 py-2 text-center">
                  <span className={`text-sm font-semibold ${
                    feedbackTone === 'good' ? 'text-emerald-300'
                    : feedbackTone === 'warn' ? 'text-amber-300' : 'text-white'
                  }`}>
                    {feedback}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls + stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="w-5 h-5 text-emerald-500" /> Session
              </CardTitle>
              <CardDescription>Choose a movement and your range of motion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Exercise</label>
                <Select value={exerciseId} onValueChange={setExerciseId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXERCISES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.seated ? ' · seated-friendly' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Targets {currentExercise.muscle}.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Range of motion</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Accessible (counts a gentle range)</SelectItem>
                    <SelectItem value="normal">Standard</SelectItem>
                    <SelectItem value="strict">Strict (full depth required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {status === 'tracking' || status === 'loading' ? (
                  <Button onClick={stop} variant="destructive" className="flex-1 gap-2">
                    <Square className="w-4 h-4" /> Stop
                  </Button>
                ) : (
                  <Button onClick={start} className="flex-1 gap-2">
                    <Play className="w-4 h-4" /> Start
                  </Button>
                )}
                <Button onClick={reset} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <Button
                  onClick={() => setVoiceOn((v) => !v)}
                  variant={voiceOn ? 'secondary' : 'outline'}
                  size="icon"
                  aria-label={voiceOn ? 'Turn voice cues off' : 'Turn voice cues on'}
                >
                  {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-500" /> Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Form score</span>
                  <span className="font-semibold">{formScore}%</span>
                </div>
                <Progress value={formScore} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Reps" value={String(reps)} />
                <Stat label="Angle" value={`${angle}°`} />
                <Stat label="Phase" value={phase} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={feedback}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-sm text-center font-medium ${toneClass}`}
                >
                  {feedbackTone === 'good' && <CheckCircle2 className="inline w-4 h-4 mr-1 -mt-0.5" />}
                  {feedback}
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center px-2">
            General movement guidance only — not medical advice. Stop if you feel pain, dizziness
            or discomfort.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 py-2">
      <div className="text-lg font-bold capitalize leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
