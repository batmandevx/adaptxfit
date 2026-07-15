import { useCallback, useEffect, useRef, useState } from 'react';
import type { BodyProfile } from '../types';
import { MotionSketch } from './MotionSketch';

interface BodyScanProps {
  value: BodyProfile;
  onChange: (next: BodyProfile) => void;
  seated: boolean;
  usesWheelchair: boolean;
}

type CamState = 'idle' | 'unsupported' | 'requesting' | 'active' | 'denied' | 'error';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Estimate a rough height/build from a captured frame. This is intentionally
 * approximate: it finds the foreground "person" blob versus the assumed
 * background at the frame edges, then maps its proportions to gentle scale
 * factors. No image is stored — only two numbers are kept.
 */
function estimateFromFrame(data: Uint8ClampedArray, w: number, h: number) {
  // Average border colour ≈ background.
  let br = 0;
  let bg = 0;
  let bb = 0;
  let count = 0;
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
    count += 1;
  };
  for (let x = 0; x < w; x += 2) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += 2) {
    sample(0, y);
    sample(w - 1, y);
  }
  br /= count;
  bg /= count;
  bb /= count;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let fg = 0;
  const threshold = 60;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const d = Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
      if (d > threshold) {
        fg += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const area = fg / (w * h);
  if (area < 0.03 || area > 0.96 || maxX <= minX || maxY <= minY) {
    return { ok: false as const };
  }
  const heightFrac = (maxY - minY) / h;
  const widthFrac = (maxX - minX) / w;
  const aspect = widthFrac / Math.max(0.01, heightFrac);

  // Gentle mappings into the avatar's scale ranges.
  const heightScale = round2(clamp(0.9 + (heightFrac - 0.55) * 0.5, 0.85, 1.15));
  const buildScale = round2(clamp(0.85 + (aspect - 0.32) * 1.6, 0.8, 1.3));
  return { ok: true as const, heightScale, buildScale };
}

export function BodyScan({ value, onChange, seated, usesWheelchair }: BodyScanProps) {
  const supported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const [cam, setCam] = useState<CamState>(supported ? 'idle' : 'unsupported');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam(supported ? 'idle' : 'unsupported');
  }, [supported]);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const startCamera = () => {
    if (!supported) return;
    setCam('requesting');
    setMessage('');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        // Bind to the <video> in an effect once it has mounted (cam 'active').
        streamRef.current = stream;
        setCam('active');
        setMessage('Stand or sit so your whole body is visible, then capture.');
      })
      .catch((err: unknown) => {
        const name = (err as { name?: string })?.name;
        setCam(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      });
  };

  // Attach the stream once the <video> is mounted.
  useEffect(() => {
    if (cam !== 'active') return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  }, [cam]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const w = 96;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 72;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const result = estimateFromFrame(data, w, h);
    stopCamera();
    if (!result.ok) {
      setMessage('We could not detect your outline clearly. Please adjust the sliders below — that works just as well.');
      return;
    }
    onChange({ heightScale: result.heightScale, buildScale: result.buildScale, source: 'scan' });
    setMessage('Done! Your avatar is sized approximately. Fine-tune with the sliders if you like.');
  };

  // Estimate sizing from an uploaded photo. The image is used only to size the
  // stylised twin and is held in memory for a small preview — never uploaded.
  const onPhotoFile = (file: File | undefined) => {
    if (!file) return;
    setMessage('Reading your photo…');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = 96;
      const h = Math.round((img.naturalHeight / img.naturalWidth) * w) || 72;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const result = estimateFromFrame(data, w, h);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(url);
      if (!result.ok) {
        setMessage('We could not detect a clear outline in that photo. The sliders below work just as well.');
        return;
      }
      onChange({ heightScale: result.heightScale, buildScale: result.buildScale, source: 'scan' });
      setMessage('Done! Your twin is sized approximately from the photo. Fine-tune with the sliders if you like.');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage('That image could not be read. Try another, or use the sliders.');
    };
    img.src = url;
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
  };

  return (
    <div className="card stack" aria-label="Body and avatar">
      <div className="row-between">
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Your movement twin (optional)</h3>
          <p className="muted" style={{ margin: '2px 0 0' }}>
            Build a rough, stylised “twin” sized to your approximate height and build, which demonstrates each
            movement during your workout. This is a stylised avatar, not a photoreal or medical scan, and no photo or
            video is ever stored.
          </p>
        </div>
        <span className="tag tag--info">Optional</span>
      </div>

      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-5)' }}>
        <div style={{ width: 150, flex: 'none' }}>
          <MotionSketch
            posture={seated ? 'seated' : 'standing'}
            focusRegion="full"
            usesWheelchair={usesWheelchair}
            visualDescription="Your stylised movement twin"
            animation="arm-reach"
            body={value}
            compact
          />
          <p className="sketch-caption" style={{ marginTop: 4 }}>
            {value.source === 'scan' ? 'Sized from your scan' : value.source === 'manual' ? 'Sized by you' : 'Default size'}
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 240 }} className="stack">
          {cam === 'active' ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="motion-video" muted playsInline aria-label="Camera preview for body scan" />
              <div className="btn-row">
                <button className="btn btn--accent btn--sm" onClick={capture}>
                  📸 Capture
                </button>
                <button className="btn btn--subtle btn--sm" onClick={stopCamera}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="btn-row">
              <button className="btn btn--accent btn--sm" onClick={startCamera} disabled={!supported}>
                📷 Scan with camera
              </button>
              <button className="btn btn--subtle btn--sm" onClick={() => fileRef.current?.click()}>
                📁 Upload a photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                aria-label="Upload a photo to size your twin"
                onChange={(e) => onPhotoFile(e.target.files?.[0] ?? undefined)}
              />
            </div>
          )}

          {photoUrl ? (
            <div className="row" style={{ gap: 'var(--space-3)' }}>
              <img src={photoUrl} alt="Your reference photo (kept on this device only)" style={{ maxWidth: 64, borderRadius: 10 }} />
              <button className="btn btn--ghost btn--sm" onClick={clearPhoto}>
                Remove photo
              </button>
            </div>
          ) : null}

          {!supported ? (
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Camera scanning is not available here — use the sliders below, which work just as well.
            </p>
          ) : null}
          {cam === 'denied' ? (
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Camera permission was declined. No problem — set your avatar with the sliders below.
            </p>
          ) : null}
          {message ? (
            <p className="muted" role="status" style={{ fontSize: '0.85rem', margin: 0 }}>
              {message}
            </p>
          ) : null}

          <label className="field" style={{ display: 'block', margin: 0 }}>
            <span className="field-label" style={{ fontSize: '0.95rem' }}>
              Height
            </span>
            <input
              className="range"
              type="range"
              min={0.85}
              max={1.15}
              step={0.01}
              value={value.heightScale}
              onChange={(e) => onChange({ ...value, heightScale: Number(e.target.value), source: 'manual' })}
              aria-label="Avatar height"
            />
          </label>
          <label className="field" style={{ display: 'block', margin: 0 }}>
            <span className="field-label" style={{ fontSize: '0.95rem' }}>
              Build
            </span>
            <input
              className="range"
              type="range"
              min={0.8}
              max={1.3}
              step={0.01}
              value={value.buildScale}
              onChange={(e) => onChange({ ...value, buildScale: Number(e.target.value), source: 'manual' })}
              aria-label="Avatar build"
            />
          </label>
          {value.source !== 'none' ? (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => onChange({ heightScale: 1, buildScale: 1, source: 'none' })}
            >
              Reset avatar size
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
