'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type TTSVoice = 'tongtong' | 'chuichui' | 'xiaochen' | 'jam' | 'kazi' | 'douji' | 'luodo';

interface UseTTSOptions {
  voice?: TTSVoice;
  speed?: number;
  autoPlay?: boolean;
}

interface UseTTSReturn {
  /** Whether TTS audio is currently playing */
  isPlaying: boolean;
  /** Whether TTS audio is being generated/loaded */
  isLoading: boolean;
  /** Error message if TTS failed */
  error: string | null;
  /** Speak the given text aloud */
  speak: (text: string, options?: { voice?: TTSVoice; speed?: number }) => void;
  /** Stop current playback */
  stop: () => void;
  /** Current speaking text */
  currentText: string | null;
  /** Available voices with labels */
  voices: { id: TTSVoice; label: string; description: string }[];
  /** Currently selected voice */
  voice: TTSVoice;
  /** Set voice */
  setVoice: (voice: TTSVoice) => void;
  /** Playback speed */
  playbackSpeed: number;
  /** Set playback speed */
  setPlaybackSpeed: (speed: number) => void;
}

const AVAILABLE_VOICES: { id: TTSVoice; label: string; description: string }[] = [
  { id: 'tongtong', label: 'TongTong', description: 'Warm & Friendly' },
  { id: 'chuichui', label: 'ChuiChui', description: 'Lively & Cute' },
  { id: 'xiaochen', label: 'XiaoChen', description: 'Calm & Professional' },
  { id: 'jam', label: 'Jam', description: 'British Gentleman' },
  { id: 'kazi', label: 'Kazi', description: 'Clear & Standard' },
  { id: 'douji', label: 'DouJi', description: 'Natural & Smooth' },
  { id: 'luodo', label: 'LuoDo', description: 'Rich & Expressive' },
];

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { voice: defaultVoice = 'tongtong', speed: defaultSpeed = 1.0 } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [voice, setVoice] = useState<TTSVoice>(defaultVoice);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentText(null);
  }, []);

  const speak = useCallback(
    async (text: string, speakOptions?: { voice?: TTSVoice; speed?: number }) => {
      // Stop any current playback
      stop();

      const trimmedText = text.trim();
      if (!trimmedText) return;

      // Truncate to 1024 chars
      const finalText = trimmedText.slice(0, 1024);
      const useVoice = speakOptions?.voice || voice;
      const useSpeed = speakOptions?.speed || playbackSpeed;

      setIsLoading(true);
      setError(null);
      setCurrentText(finalText);

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: finalText,
            voice: useVoice,
            speed: Math.max(0.5, Math.min(2.0, useSpeed)),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'TTS failed' }));
          throw new Error(errData.error || 'Failed to generate speech');
        }

        const audioBlob = await response.blob();
        // Ensure correct MIME type for WAV audio
        const wavBlob = new Blob([audioBlob], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(wavBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentText(null);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setError('Audio playback failed');
          setIsPlaying(false);
          setIsLoading(false);
          setCurrentText(null);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User cancelled, not an error
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'TTS failed';
        setError(errorMessage);
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentText(null);
      }
    },
    [voice, playbackSpeed, stop]
  );

  return {
    isPlaying,
    isLoading,
    error,
    speak,
    stop,
    currentText,
    voices: AVAILABLE_VOICES,
    voice,
    setVoice,
    playbackSpeed,
    setPlaybackSpeed,
  };
}
