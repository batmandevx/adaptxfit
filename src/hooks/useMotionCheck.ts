import { useCallback, useEffect, useRef, useState } from 'react';

export type MotionStatus = 'idle' | 'unsupported' | 'requesting' | 'active' | 'denied' | 'error';

interface UseMotionCheckResult {
  status: MotionStatus;
  feedback: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  start: () => void;
  stop: () => void;
  supported: boolean;
}

const SAMPLE_MS = 600;

// Gentle, non-medical feedback. We never claim correctness or guaranteed safety,
// and we never store any frames — only a tiny downscaled buffer kept in memory
// to compare against the next sample, then overwritten.
const FEEDBACK = {
  lowLight: 'Low light detected. Adjust your lighting, or continue comfortably without Motion Check.',
  hardToDetect: 'The movement may be hard to detect. Adjust your camera, or continue without Motion Check.',
  controlled: 'Your movement appears controlled. Keep going at your pace.',
  slower: 'Looks active — try moving a little slower and with control if that feels better.',
  steady: 'Nice and steady. Use chair or wall support any time you want more stability.',
};

export function useMotionCheck(): UseMotionCheckResult {
  const supported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  const [status, setStatus] = useState<MotionStatus>(supported ? 'idle' : 'unsupported');
  const [feedback, setFeedback] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const timerRef = useRef<number | null>(null);
  const sampleCountRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    prevFrameRef.current = null;
    sampleCountRef.current = 0;
    setStatus(supported ? 'idle' : 'unsupported');
    setFeedback('');
  }, [supported]);

  const sample = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 64;
      canvasRef.current.height = 48;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Average brightness for low-light detection.
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    brightness /= data.length / 4;

    const prev = prevFrameRef.current;
    let motion = 0;
    if (prev) {
      let diff = 0;
      for (let i = 0; i < data.length; i += 4) {
        diff += Math.abs(data[i] - prev[i]);
      }
      motion = diff / (data.length / 4);
    }
    prevFrameRef.current = data;
    sampleCountRef.current += 1;

    // Let a couple of frames pass before giving feedback.
    if (sampleCountRef.current < 3) return;

    if (brightness < 35) {
      setFeedback(FEEDBACK.lowLight);
    } else if (motion < 2) {
      setFeedback(FEEDBACK.hardToDetect);
    } else if (motion < 14) {
      setFeedback(sampleCountRef.current % 4 === 0 ? FEEDBACK.steady : FEEDBACK.controlled);
    } else {
      setFeedback(FEEDBACK.slower);
    }
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        // Bind to the <video> in an effect once it has mounted (status 'active').
        streamRef.current = stream;
        setStatus('active');
        setFeedback('Motion Check is on. This gives general movement feedback, not a medical assessment.');
      })
      .catch((err: unknown) => {
        const name = (err as { name?: string })?.name;
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      });
  }, [supported]);

  // Attach the stream to the <video> only after it is mounted, then sample.
  useEffect(() => {
    if (status !== 'active') return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
    timerRef.current = window.setInterval(sample, SAMPLE_MS);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, sample]);

  useEffect(() => () => stop(), [stop]);

  return { status, feedback, videoRef, start, stop, supported };
}
