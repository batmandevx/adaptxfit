import { useCallback, useEffect, useState } from 'react';
import type { AbilityProfile, ReplacementReason, Workout } from '../types';
import { REPLACEMENT_REASONS } from '../data/options';
import { buildExerciseScript, getVoice, restAnnouncement } from '../engine/coaching';
import { useAccessibility } from '../context/AccessibilityContext';
import { useSpeech } from '../hooks/useSpeech';
import { useSound } from '../hooks/useSound';
import { MotionSketch, animationForExercise } from '../components/MotionSketch';
import { MotionCheckPanel } from '../components/MotionCheckPanel';
import { SafetyLabels } from '../components/SafetyLabels';
import { AiMoveImage } from '../components/AiMoveImage';
import { Segmented } from '../components/Inputs';
import { generateMovementGif } from '../utils/avatarGif';

type Phase = 'ready' | 'getready' | 'exercise' | 'rest' | 'done';

interface SessionScreenProps {
  profile: AbilityProfile;
  workout: Workout;
  onStatusChange: (index: number, status: 'completed' | 'skipped' | 'pending') => void;
  onReplace: (index: number, reason: ReplacementReason) => void;
  onFinish: () => void;
  onExit: () => void;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Circular countdown ring with the time remaining in the centre. */
function TimerRing({ seconds, total, label }: { seconds: number; total: number; label: string }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const fraction = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  return (
    <svg
      className="timer-ring"
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${label}: ${fmt(seconds)} remaining`}
    >
      <circle className="timer-ring-bg" cx="60" cy="60" r={r} />
      <circle
        className="timer-ring-fg"
        cx="60"
        cy="60"
        r={r}
        style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - fraction) }}
      />
      <text className="timer-ring-text" x="60" y="60" dominantBaseline="central" textAnchor="middle">
        {fmt(seconds)}
      </text>
    </svg>
  );
}

export function SessionScreen({ profile, workout, onStatusChange, onReplace, onFinish, onExit }: SessionScreenProps) {
  const { settings } = useAccessibility();
  const speech = useSpeech(settings.voiceGuidance);
  const sound = useSound(settings.soundCues);
  const tone = profile.preferences.coachingTone;

  const [phase, setPhase] = useState<Phase>('ready');
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [showReasons, setShowReasons] = useState(false);
  const [showMotion, setShowMotion] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifBusy, setGifBusy] = useState(false);
  const [gifError, setGifError] = useState('');
  const [visualMode, setVisualMode] = useState<'twin' | 'sketch'>('twin');

  const total = workout.exercises.length;
  const current = workout.exercises[index];
  const nextExercise = workout.exercises[index + 1];
  const completedCount = workout.exercises.filter((e) => e.status === 'completed').length;

  const finishToDone = useCallback(() => {
    setPhase('done');
    setRunning(false);
    sound.chime();
  }, [sound]);

  const enterExercise = useCallback((i: number) => {
    // A short "get ready" countdown precedes every exercise.
    setIndex(i);
    setPhase('getready');
    setSecondsLeft(3);
    setPhaseTotal(3);
    setRunning(true);
    setShowReasons(false);
  }, []);

  const startExercise = useCallback(() => {
    const dur = workout.exercises[index]?.durationSeconds ?? 40;
    setPhase('exercise');
    setSecondsLeft(dur);
    setPhaseTotal(dur);
    setRunning(true);
    sound.go();
  }, [workout.exercises, index, sound]);

  const enterRest = useCallback(() => {
    const rest = current?.restSeconds ?? 30;
    setSecondsLeft(rest);
    setPhaseTotal(rest);
    setPhase('rest');
    setRunning(true);
  }, [current]);

  const completeCurrent = useCallback(() => {
    onStatusChange(index, 'completed');
    if (index >= total - 1) finishToDone();
    else enterRest();
  }, [index, total, onStatusChange, finishToDone, enterRest]);

  const skipCurrent = useCallback(() => {
    onStatusChange(index, 'skipped');
    if (index >= total - 1) finishToDone();
    else enterRest();
  }, [index, total, onStatusChange, finishToDone, enterRest]);

  const goNext = useCallback(() => {
    if (index >= total - 1) finishToDone();
    else enterExercise(index + 1);
  }, [index, total, finishToDone, enterExercise]);

  const goPrev = useCallback(() => {
    if (index > 0) enterExercise(index - 1);
  }, [index, enterExercise]);

  // Countdown ticking.
  useEffect(() => {
    if (!running || (phase !== 'exercise' && phase !== 'rest' && phase !== 'getready')) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  // Total elapsed workout time (count-up while a phase is active and running).
  useEffect(() => {
    if (!running || phase === 'ready' || phase === 'done') return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  // Gentle audio count-in on the final seconds of the countdown and rest.
  useEffect(() => {
    if (!running) return;
    if ((phase === 'getready' || phase === 'rest') && secondsLeft >= 1 && secondsLeft <= 3) {
      sound.tick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, running]);

  // Auto-advance when a phase timer reaches zero.
  useEffect(() => {
    if (secondsLeft !== 0) return;
    if (phase === 'getready') startExercise();
    else if (phase === 'exercise') completeCurrent();
    else if (phase === 'rest') goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  // Voice + caption announcements on phase / exercise change.
  useEffect(() => {
    if (phase === 'getready' && current) {
      speech.speak(`Get ready. ${current.name} coming up.`);
    } else if (phase === 'exercise' && current) {
      speech.speak(
        buildExerciseScript({
          name: current.name,
          startingPosition: current.startingPosition,
          steps: current.steps,
          voiceGuidance: current.voiceGuidance,
          simpleLanguage: settings.simpleLanguage,
        }),
      );
    } else if (phase === 'rest') {
      speech.speak(restAnnouncement(tone, current?.restSeconds ?? 30));
    } else if (phase === 'done') {
      speech.speak(getVoice(tone).complete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  const handleReason = (reason: ReplacementReason) => {
    setShowReasons(false);
    onReplace(index, reason);
    // Restart the current slot with the freshly swapped-in exercise.
    const dur = workout.exercises[index]?.durationSeconds ?? 40;
    setPhase('exercise');
    setRunning(true);
    setSecondsLeft(dur);
    setPhaseTotal(dur);
  };

  // Clear any generated GIF when the exercise changes.
  useEffect(() => {
    setGifUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGifError('');
  }, [index]);

  const makeGif = useCallback(async () => {
    if (!current) return;
    setGifBusy(true);
    setGifError('');
    try {
      const cs = getComputedStyle(document.documentElement);
      const { url } = await generateMovementGif({
        posture: current.posture === 'wheelchair' ? 'seated' : current.posture,
        wheelchair: profile.usesWheelchair,
        heightScale: profile.bodyProfile?.heightScale ?? 1,
        buildScale: profile.bodyProfile?.buildScale ?? 1,
        animation: animationForExercise(current),
        colors: {
          stroke: cs.getPropertyValue('--primary-strong').trim() || '#0a5b54',
          faint: cs.getPropertyValue('--text-faint').trim() || '#6b7888',
          surface: cs.getPropertyValue('--surface').trim() || '#ffffff',
        },
      });
      setGifUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setGifError('Could not generate a GIF here — the animated guide above still works.');
    } finally {
      setGifBusy(false);
    }
  }, [current, profile.usesWheelchair, profile.bodyProfile]);

  // ----- READY -----
  if (phase === 'ready') {
    return (
      <div className="screen stack" style={{ maxWidth: 720, margin: '0 auto' }}>
        <span className="eyebrow">Guided session</span>
        <h1 style={{ margin: 0 }}>{workout.style}</h1>
        <p className="muted">
          {total} exercises • about {workout.estimatedMinutes} minutes. You can pause, skip, replace, or stop at any
          time — you are always in control.
        </p>
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">💡</span>
          <span>{getVoice(tone).intro}</span>
        </div>
        {settings.voiceGuidance && !speech.supported ? (
          <div className="notice notice--info">
            <span className="ic" aria-hidden="true">ℹ️</span>
            <span>Voice guidance is not available in this browser, so we will show captions and on-screen text instead.</span>
          </div>
        ) : null}
        <div className="btn-row">
          <button className="btn btn--primary btn--lg" onClick={() => { sound.prime(); enterExercise(0); }}>
            ▶ Begin
          </button>
          <button className="btn btn--ghost" onClick={onExit}>
            ← Back to plan
          </button>
        </div>
      </div>
    );
  }

  // ----- DONE -----
  if (phase === 'done') {
    return (
      <div className="screen stack center" style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🎉</div>
        <h1 style={{ margin: 0 }}>Movement complete</h1>
        <p className="muted">{getVoice(tone).complete}</p>
        <p>
          You completed <strong>{completedCount}</strong> of {total} exercises at your own pace.
        </p>
        <button className="btn btn--primary btn--lg" onClick={onFinish}>
          Share how it felt →
        </button>
      </div>
    );
  }

  // ----- ACTIVE (exercise / rest) -----
  return (
    <div className="screen stack" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="row-between">
        <span className="muted">
          Exercise {index + 1} of {total} • <span title="Total time">⏱ {fmt(elapsed)}</span>
        </span>
        <button className="btn btn--ghost btn--sm" onClick={onExit}>
          Exit session
        </button>
      </div>

      <div className="dots" role="img" aria-label={`Progress: ${completedCount} of ${total} completed`}>
        {workout.exercises.map((e, i) => (
          <span
            key={i}
            className={`dot ${e.status === 'completed' ? 'dot--done' : ''} ${e.status === 'skipped' ? 'dot--skipped' : ''} ${i === index ? 'dot--current' : ''}`}
          />
        ))}
      </div>

      <div className="session-stage">
        {phase === 'getready' ? (
          <div className="center stack" style={{ alignItems: 'center' }}>
            <span className="session-phase">Get ready</span>
            <div className="countdown-num" aria-live="assertive">{secondsLeft}</div>
            <p className="muted" style={{ margin: 0 }}>
              Coming up: <strong>{current.name}</strong> — {current.repsOrTime}
            </p>
            <div style={{ width: 150 }}>
              <MotionSketch
                posture={current.posture}
                focusRegion={current.focusRegion}
                usesWheelchair={profile.usesWheelchair}
                visualDescription={current.visualDescription}
                animation={animationForExercise(current)}
                body={profile.bodyProfile}
                compact
              />
            </div>
          </div>
        ) : phase === 'rest' ? (
          <div className="center stack" style={{ alignItems: 'center' }}>
            <span className="session-phase">Rest</span>
            <TimerRing seconds={secondsLeft} total={phaseTotal} label="Rest" />
            <p className="muted">{getVoice(tone).rest}</p>
            {nextExercise ? (
              <div className="next-up">
                <strong>Next up:</strong> {nextExercise.name} — {nextExercise.repsOrTime}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="stack">
            <div className="row-between">
              <span className="session-phase">Now</span>
              <span className="session-timer" style={{ fontSize: '2rem' }} aria-live="polite">
                {fmt(secondsLeft)}
              </span>
            </div>
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((1 - secondsLeft / Math.max(1, phaseTotal)) * 100)}%` }}
              />
            </div>
            <h2 className="session-title">{current.name}</h2>
            <SafetyLabels tags={current.tags} max={6} />
            <div className="row-between">
              <Segmented
                label="Visual mode"
                options={[
                  { value: 'twin', label: '🖼️ AI image' },
                  { value: 'sketch', label: '✏️ Animated' },
                ]}
                value={visualMode}
                onChange={(v) => setVisualMode(v as 'twin' | 'sketch')}
              />
            </div>
            <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-4)' }}>
              <div style={{ width: visualMode === 'twin' ? 240 : 200, flex: 'none' }}>
                {visualMode === 'twin' ? (
                  <AiMoveImage
                    key={current.id}
                    exercise={current}
                    profile={profile}
                    auto
                    fallback={
                      <MotionSketch
                        posture={current.posture}
                        focusRegion={current.focusRegion}
                        usesWheelchair={profile.usesWheelchair}
                        visualDescription={current.visualDescription}
                        animation={animationForExercise(current)}
                        body={profile.bodyProfile}
                        compact
                      />
                    }
                  />
                ) : (
                  <MotionSketch
                    posture={current.posture}
                    focusRegion={current.focusRegion}
                    usesWheelchair={profile.usesWheelchair}
                    visualDescription={current.visualDescription}
                    animation={animationForExercise(current)}
                    body={profile.bodyProfile}
                    compact
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ marginTop: 0 }}>
                  <strong>{current.repsOrTime}</strong> — {current.startingPosition}
                </p>
                <ol className="steps-list">
                  {current.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="notice notice--safety">
              <span className="ic" aria-hidden="true">⚠️</span>
              <span>{current.safetyNotes.join(' ')} Stop if you feel pain, dizziness, numbness, or discomfort.</span>
            </div>

            <div className="stack-sm">
              <div className="btn-row">
                <button className="btn btn--subtle btn--sm" onClick={makeGif} disabled={gifBusy}>
                  {gifBusy ? 'Creating GIF…' : '🎞️ Make a GIF of this move'}
                </button>
                {gifUrl ? (
                  <a className="btn btn--ghost btn--sm" href={gifUrl} download={`${current.id}-movement.gif`}>
                    ⬇ Download GIF
                  </a>
                ) : null}
              </div>
              {gifError ? (
                <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>{gifError}</p>
              ) : null}
              {gifUrl ? (
                <img src={gifUrl} alt={`Animated movement guide for ${current.name}`} className="movement-gif" />
              ) : null}
            </div>
          </div>
        )}

        <div className="session-controls">
          <button className="btn btn--ghost" onClick={() => setRunning((r) => !r)} aria-pressed={!running}>
            {running ? '⏸ Pause' : '▶ Resume'}
          </button>
          {phase === 'exercise' ? (
            <>
              <button className="btn btn--primary" onClick={completeCurrent}>
                ✓ Done
              </button>
              <button className="btn btn--subtle" onClick={skipCurrent}>
                ⤼ Skip
              </button>
              <button className="btn btn--subtle" onClick={() => setShowReasons((v) => !v)} aria-expanded={showReasons}>
                ↻ Replace
              </button>
            </>
          ) : phase === 'getready' ? (
            <button className="btn btn--primary" onClick={startExercise}>
              Start now →
            </button>
          ) : (
            <button className="btn btn--primary" onClick={goNext}>
              Next →
            </button>
          )}
          <button className="btn btn--ghost" onClick={goPrev} disabled={index === 0}>
            ← Previous
          </button>
        </div>

        {showReasons ? (
          <div role="group" aria-label="Why replace this exercise?" style={{ marginTop: 'var(--space-3)' }}>
            <p className="field-hint">Swap in a safer option that respects your profile:</p>
            <div className="reason-grid">
              {REPLACEMENT_REASONS.map((reason) => (
                <button key={reason.value} className="btn btn--subtle btn--sm" onClick={() => handleReason(reason.value as ReplacementReason)}>
                  {reason.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={() => setShowMotion((v) => !v)} aria-expanded={showMotion}>
          {showMotion ? 'Hide Motion Check' : '📷 Motion Check (optional)'}
        </button>
        <button className="btn btn--accent" onClick={finishToDone}>
          Finish workout
        </button>
      </div>

      {showMotion ? <MotionCheckPanel /> : null}
    </div>
  );
}
