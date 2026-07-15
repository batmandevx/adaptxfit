import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechResult {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

/**
 * Thin wrapper around the browser Speech Synthesis API for voice guidance.
 * Entirely optional: when the API is missing, `supported` is false and the UI
 * falls back to on-screen captions/text instructions.
 */
export function useSpeech(enabled: boolean): UseSpeechResult {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabledRef.current || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  // Stop any in-flight speech when guidance is switched off or on unmount.
  useEffect(() => {
    if (!enabled) cancel();
    return () => cancel();
  }, [enabled, cancel]);

  return { supported, speaking, speak, cancel };
}
