'use client';

import { useState, useRef, useCallback } from 'react';

interface UseASROptions {
  /** Callback when transcription is complete */
  onTranscription?: (text: string) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

interface UseASRReturn {
  /** Whether currently recording audio */
  isRecording: boolean;
  /** Whether transcription is in progress */
  isTranscribing: boolean;
  /** The transcribed text */
  transcription: string | null;
  /** Error message if transcription failed */
  error: string | null;
  /** Start recording audio from microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and transcribe */
  stopRecording: () => Promise<void>;
  /** Clear the current transcription */
  clearTranscription: () => void;
  /** Audio level (0-1) for visualization */
  audioLevel: number;
}

export function useASR(options?: UseASROptions): UseASRReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearTranscription = useCallback(() => {
    setTranscription(null);
    setError(null);
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    // Calculate RMS audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(Math.min(rms * 3, 1)); // Amplify for visual effect
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyser for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError(null);

      // Start audio level monitoring
      updateAudioLevel();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errMsg);
      optionsRef.current?.onError?.(errMsg);
    }
  }, [updateAudioLevel]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        // Stop audio level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        setIsRecording(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Create audio blob and transcribe
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 100) {
          // Too small, probably no speech
          resolve();
          return;
        }

        setIsTranscribing(true);
        try {
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
              const response = await fetch('/api/asr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_base64: base64Audio }),
              });
              const data = await response.json();
              if (data.success) {
                setTranscription(data.transcription);
                // Call the onTranscription callback directly (inside onstop handler, not an effect)
                optionsRef.current?.onTranscription?.(data.transcription);
              } else {
                const errMsg = data.error || 'Transcription failed';
                setError(errMsg);
                optionsRef.current?.onError?.(errMsg);
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Transcription failed';
              setError(errMsg);
              optionsRef.current?.onError?.(errMsg);
            } finally {
              setIsTranscribing(false);
              resolve();
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Failed to process audio';
          setError(errMsg);
          optionsRef.current?.onError?.(errMsg);
          setIsTranscribing(false);
          resolve();
        }
      };

      mediaRecorderRef.current!.stop();
    });
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcription,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
    audioLevel,
  };
}
