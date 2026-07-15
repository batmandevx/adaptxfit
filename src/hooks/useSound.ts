import { useCallback, useEffect, useRef } from 'react';

/**
 * Tiny WebAudio cue generator for the guided session. No assets, no network.
 * Cues only play when `enabled` is true; everything fails silently if the
 * Web Audio API is unavailable.
 */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(
    (freq: number, duration = 0.12, type: OscillatorType = 'sine', gain = 0.05) => {
      if (!enabledRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      try {
        if (ctx.state === 'suspended') void ctx.resume();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(ctx.destination);
        const t = ctx.currentTime;
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.start(t);
        osc.stop(t + duration);
      } catch {
        /* ignore audio errors */
      }
    },
    [getCtx],
  );

  /** Prime the audio context from a user gesture so later cues are allowed. */
  const prime = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }, [getCtx]);

  const tick = useCallback(() => beep(660, 0.07, 'triangle', 0.035), [beep]);
  const go = useCallback(() => beep(980, 0.18, 'sine', 0.06), [beep]);
  const chime = useCallback(() => {
    beep(740, 0.12, 'sine', 0.05);
    window.setTimeout(() => beep(988, 0.18, 'sine', 0.06), 130);
  }, [beep]);

  useEffect(() => {
    return () => {
      try {
        void ctxRef.current?.close();
      } catch {
        /* ignore */
      }
      ctxRef.current = null;
    };
  }, []);

  return { prime, tick, go, chime };
}
