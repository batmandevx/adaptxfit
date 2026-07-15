import { useMotionCheck } from '../hooks/useMotionCheck';

/**
 * Optional, consent-based Motion Check. Camera access is requested only when the
 * user explicitly starts it, no frames are ever stored, and the whole workout
 * works without it. Feedback is gentle and explicitly non-medical.
 */
export function MotionCheckPanel() {
  const { status, feedback, videoRef, start, stop, supported } = useMotionCheck();

  return (
    <div className="card motion-check" aria-label="Motion Check">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>Motion Check (optional)</h3>
        <span className="tag tag--info">Camera · consent-based</span>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Motion Check uses your camera to give general movement feedback. It is optional, never stores video,
        and is not a medical assessment. You can do the whole workout without it.
      </p>

      {!supported ? (
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">ℹ️</span>
          <span>Camera-based Motion Check is not available in this browser, so we will continue with your profile and on-screen guidance.</span>
        </div>
      ) : null}

      {status === 'denied' ? (
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">ℹ️</span>
          <span>Camera permission was declined. That is completely fine — continue with on-screen and voice guidance.</span>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">ℹ️</span>
          <span>We could not start the camera. You can continue the workout without Motion Check.</span>
        </div>
      ) : null}

      {status === 'active' ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="motion-video" muted playsInline aria-label="Live camera preview for Motion Check" />
          <p className="motion-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
        </>
      ) : null}

      <div className="btn-row">
        {status !== 'active' ? (
          <button className="btn btn--accent btn--sm" onClick={start} disabled={!supported}>
            Turn on Motion Check
          </button>
        ) : (
          <button className="btn btn--subtle btn--sm" onClick={stop}>
            Turn off Motion Check
          </button>
        )}
      </div>
    </div>
  );
}
