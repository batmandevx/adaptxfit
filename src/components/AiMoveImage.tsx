import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AbilityProfile, Exercise } from '../types';
import { movementImageForExercise, seedFromId } from '../utils/imageGen';
import { animationForExercise } from './MotionSketch';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface AiMoveImageProps {
  exercise: Exercise;
  profile: AbilityProfile;
  /** Auto-generate when the exercise changes (used for the main session visual). */
  auto?: boolean;
  /** Shown while idle / loading / on error so the visual is never empty. */
  fallback?: ReactNode;
}

/**
 * Optional AI-generated illustration of the current movement, adapted to the
 * user's support needs. We show ONE clean, dynamic action still per exercise:
 * two independently generated AI stills never align, so alternating them
 * flickers instead of looking like one body moving — the genuine motion comes
 * from the animated SVG sketch (also used as the fallback while this loads).
 * The user's photo is never sent — only a text description of the movement.
 */
export function AiMoveImage({ exercise, profile, auto, fallback }: AiMoveImageProps) {
  const animation = useMemo(() => animationForExercise(exercise), [exercise]);

  const [status, setStatus] = useState<Status>('idle');
  const [src, setSrc] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => seedFromId(exercise.id));
  const attemptRef = useRef(0);

  const generate = (useSeed: number) => {
    setSeed(useSeed);
    attemptRef.current = 0;
    setStatus('loading');
    setSrc(movementImageForExercise(exercise, profile, animation, useSeed, { width: 448, height: 448 }));
  };

  // On exercise change: auto-generate, or reset to idle for on-demand mode.
  useEffect(() => {
    if (auto) {
      generate(seedFromId(exercise.id));
    } else {
      setStatus('idle');
      setSrc(null);
      setSeed(seedFromId(exercise.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id, auto]);

  // Time out a stuck request so the visual never hangs on "loading".
  useEffect(() => {
    if (status !== 'loading') return;
    const id = window.setTimeout(() => setStatus((cur) => (cur === 'loading' ? 'error' : cur)), 20_000);
    return () => window.clearTimeout(id);
  }, [status, src]);

  // The provider can occasionally return a non-image (ORB-blocked / 5xx). Retry
  // once with a cache-busted URL before falling back to the animated sketch.
  const handleError = () => {
    if (attemptRef.current < 1) {
      attemptRef.current = 1;
      setSrc((cur) => (cur ? `${cur}${cur.includes('?') ? '&' : '?'}retry=1` : cur));
    } else {
      setStatus('error');
    }
  };

  const regenerate = () => generate(Math.floor(Math.random() * 100000));

  return (
    <div className="stack-sm">
      {/* The AI still: hidden until loaded, so the animated sketch shows meanwhile. */}
      {src ? (
        <img
          src={src}
          alt={`AI illustration: ${exercise.visualDescription}`}
          className="ai-move-img"
          style={{ display: status === 'done' ? 'block' : 'none' }}
          onLoad={() => setStatus('done')}
          onError={handleError}
        />
      ) : null}

      {/* Animated movement sketch — the real motion guide — while not showing the AI still. */}
      {status !== 'done' && fallback ? fallback : null}

      {status === 'loading' ? (
        <p className="muted" role="status" aria-live="polite" style={{ margin: 0, fontSize: '0.85rem' }}>
          ✨ Generating an AI illustration of this move…
        </p>
      ) : null}

      {status === 'idle' && !auto ? (
        <button className="btn btn--accent btn--sm" onClick={() => generate(seed)}>
          🖼️ Generate AI visual of this move
        </button>
      ) : null}

      {status === 'done' ? (
        <>
          <div className="btn-row">
            <button className="btn btn--subtle btn--sm" onClick={regenerate}>
              ↻ Regenerate
            </button>
            <a className="btn btn--ghost btn--sm" href={src ?? '#'} target="_blank" rel="noreferrer">
              ⤢ Open full size
            </a>
          </div>
          <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
            AI illustration adapted to your profile — switch to ✏️ Animated to see the movement in motion. Free
            Pollinations.ai · only a text description is sent, never your photo. Not a photoreal scan or medical
            guidance.
          </p>
        </>
      ) : null}

      {status === 'error' ? (
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">ℹ️</span>
          <span>
            AI image unavailable right now — showing the animated movement sketch instead.{' '}
            <button className="btn btn--subtle btn--sm" style={{ marginTop: 6 }} onClick={() => generate(seed)}>
              Try again
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
