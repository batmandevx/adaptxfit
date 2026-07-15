import { useCallback, useState } from 'react';

export type AiCoachState = 'idle' | 'loading' | 'done' | 'offline' | 'error';

export interface AiCoachPayload {
  style: string;
  adaptations: string[];
  equipment: string[];
  goals: string[];
  targetMuscles: string[];
  protect: string[];
  exercises: string[];
  tone: string;
}

const ENDPOINT =
  (import.meta.env.VITE_AI_COACH_URL as string | undefined) ?? 'http://localhost:8787/api/ai-coach';

/**
 * Optional AI Coach. Calls the local Copilot-CLI-backed server for a short,
 * supplementary, non-medical encouragement note. If the server is not running,
 * it fails gracefully into an `offline` state — the app keeps working fully.
 */
export function useAiCoach() {
  const [state, setState] = useState<AiCoachState>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const ask = useCallback(async (payload: AiCoachPayload) => {
    setState('loading');
    setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95_000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Server responded ${res.status}.`);
        setState('error');
        return;
      }
      const data = (await res.json()) as { text?: string };
      setText(data.text ?? '');
      setState('done');
    } catch {
      // Network failure usually means the optional local server is not running.
      setState('offline');
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setText('');
    setError('');
  }, []);

  return { state, text, error, ask, reset };
}
