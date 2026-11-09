'use client';

/**
 * BodyHalo — the cinematic hero visual (shell.md §5.4).
 *
 * A layered CSS/SVG composition: concentric coach-halo guides, two dashed
 * orbit rings rotating in opposite directions (48s / 64s), a glowing
 * body-constellation figure, a vertical alignment beam, and three floating
 * telemetry cards. Pointer parallax (spring-gentle) on capable devices.
 *
 * Reduced motion: static rings, no float, no parallax; telemetry cards
 * remain visible in final positions and the whole panel fades in.
 *
 * Keyboard: focusable region; on focus a text description panel appears.
 */

import * as React from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { AudioWaveform, MoveDiagonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReduced, SPRING, DURATION, EASE } from './motion';

/* ---- Inline SVG: coach-halo (concentric camera framing guides) ---- */
function CoachHaloSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 1200" fill="none" aria-hidden="true" className={className}>
      <circle cx="600" cy="600" r="520" stroke="#59E3A9" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="600" cy="600" r="400" stroke="#63D6C5" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="4 14" />
      <circle cx="600" cy="600" r="280" stroke="#59E3A9" strokeOpacity="0.4" strokeWidth="2" />
      {/* Framing guides */}
      <path d="M600 60v120M600 1020v120M60 600h120M1020 600h120" stroke="#63D6C5" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      {/* Corner brackets */}
      <path d="M150 230v-80h80M1050 150h-80v80M1050 970v80h-80M150 890v80h80" stroke="#59E3A9" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ---- Inline SVG: body-constellation (inclusive neutral figure) ---- */
function BodyConstellationSvg({ className }: { className?: string }) {
  const node = '#59E3A9';
  const teal = '#63D6C5';
  const line = 'rgba(99,214,197,0.55)';
  return (
    <svg viewBox="0 0 300 620" fill="none" aria-hidden="true" className={className}>
      {/* Bone lines */}
      <g stroke={line} strokeWidth="3" strokeLinecap="round">
        <path d="M150 118V250" />
        <path d="M150 140L84 190M150 140l66 50" />
        <path d="M84 190l-20 84M234 190l20 84" />
        <path d="M150 250l-44 130M150 250l44 130" />
        <path d="M106 380l-10 150M194 380l10 150" />
      </g>
      {/* Wheelchair-adaptive alternate limb position (dashed) */}
      <g stroke="#F0C66B" strokeOpacity="0.5" strokeWidth="2.5" strokeDasharray="5 9" strokeLinecap="round">
        <path d="M150 250l-58 78M150 250l58 78" />
        <path d="M92 328h116" />
      </g>
      {/* Joint nodes */}
      <g fill={node}>
        <circle cx="150" cy="118" r="7" />
        <circle cx="84" cy="190" r="7" fill={teal} />
        <circle cx="234" cy="190" r="7" fill={teal} />
        <circle cx="64" cy="274" r="6" />
        <circle cx="254" cy="274" r="6" />
        <circle cx="150" cy="250" r="8" />
        <circle cx="106" cy="380" r="7" fill={teal} />
        <circle cx="194" cy="380" r="7" fill={teal} />
        <circle cx="96" cy="530" r="6" />
        <circle cx="204" cy="530" r="6" />
      </g>
      {/* Alternate nodes (dashed) */}
      <g fill="none" stroke="#F0C66B" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="3 6">
        <circle cx="92" cy="328" r="8" />
        <circle cx="208" cy="328" r="8" />
      </g>
      {/* Head */}
      <circle cx="150" cy="84" r="26" stroke={node} strokeWidth="4" />
    </svg>
  );
}

/* ---- Telemetry card ---- */
function TelemetryCard({
  label,
  value,
  tone,
  icon,
  className,
  floatDelay,
  reduced,
  style,
}: {
  label: string;
  value: string;
  tone: 'success' | 'secondary' | 'primary';
  icon?: React.ReactNode;
  className?: string;
  floatDelay: number;
  reduced: boolean;
  style?: React.ComponentProps<typeof motion.div>['style'];
}) {
  const dot =
    tone === 'success'
      ? 'bg-success'
      : tone === 'secondary'
        ? 'bg-secondary'
        : 'bg-primary';
  return (
    <div className={cn('absolute', className)}>
      <motion.div
        className="glass-overlay flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
        style={style}
        animate={reduced ? undefined : { y: [-6, 6] }}
        transition={
          reduced
            ? undefined
            : {
                duration: 2.4,
                delay: floatDelay,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }
        }
      >
        {icon ?? <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', dot)} />}
        <div>
          <p className="text-xs font-medium text-foreground-subtle">{label}</p>
          <p className="text-sm font-semibold font-mono tabular-nums text-foreground">{value}</p>
        </div>
      </motion.div>
    </div>
  );
}

export interface BodyHaloProps {
  className?: string;
}

export function BodyHalo({ className }: BodyHaloProps) {
  const reduced = useReduced();
  const [descVisible, setDescVisible] = React.useState(false);

  /* Pointer parallax (spring-gentle); disabled under reduced motion */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, SPRING.gentle);
  const sy = useSpring(py, SPRING.gentle);

  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
  const haloX = useTransform(sx, (v) => clamp(v * 0.012, 8));
  const haloY = useTransform(sy, (v) => clamp(v * 0.012, 8));
  const cardX = useTransform(sx, (v) => clamp(v * 0.02, 12));
  const cardY = useTransform(sy, (v) => clamp(v * 0.02, 12));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set(e.clientX - (rect.left + rect.width / 2));
    py.set(e.clientY - (rect.top + rect.height / 2));
  };
  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  const [hovered, setHovered] = React.useState(false);
  const active = hovered || descVisible;

  return (
    <motion.div
      initial={
        reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(12px)' }
      }
      animate={
        reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }
      }
      transition={
        reduced
          ? { duration: 0.14, ease: 'linear' }
          : { duration: 0.64, delay: 0.26, ease: EASE.careOut }
      }
      className={cn('relative mx-auto w-full max-w-[520px]', className)}
    >
      <div
        role="img"
        aria-label="Body Halo preview: a stylized body map shows alignment, form score, range, and voice readiness."
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={() => setHovered(true)}
        onFocus={() => setDescVisible(true)}
        onBlur={() => setDescVisible(false)}
        className="group relative h-[340px] w-full overflow-hidden rounded-[32px] border border-border/80 lg:h-[620px]"
        style={{
          background:
            'linear-gradient(180deg, var(--surface-raised), var(--surface))',
          boxShadow: 'var(--shadow-glow-primary), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Layer 1+3+beam: parallax halo group */}
        <motion.div
          className="absolute inset-0"
          style={reduced ? undefined : { x: haloX, y: haloY }}
        >
          {/* Coach halo guides at 92% width, opacity 0.36 */}
          <CoachHaloSvg className="absolute left-1/2 top-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 opacity-[0.36]" />

          {/* Alignment beam: 2px vertical, transparent → primary → transparent */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[90px] h-[min(430px,calc(100%-110px))] w-[2px] -translate-x-1/2 opacity-[0.42]"
            style={{
              background:
                'linear-gradient(transparent, var(--primary), transparent)',
            }}
          />

          {/* Body constellation, 300px desktop */}
          <BodyConstellationSvg
            className={cn(
              'absolute left-1/2 top-1/2 h-[78%] -translate-x-1/2 -translate-y-1/2 transition-[filter,opacity] duration-300',
              active ? 'brightness-[1.12]' : 'brightness-100',
            )}
          />
        </motion.div>

        {/* Layer 2: orbit rings (SVG dashes; CSS rotation, reduced-motion safe) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 lg:h-[420px] lg:w-[420px]"
        >
          <svg viewBox="0 0 420 420" className="orbit-ring-outer h-full w-full">
            <circle
              cx="210"
              cy="210"
              r="208"
              fill="none"
              stroke="var(--primary)"
              strokeOpacity={active ? 0.52 : 0.3}
              strokeWidth="1.5"
              strokeDasharray="2 8"
              strokeLinecap="round"
              style={{ transition: 'stroke-opacity 300ms' }}
            />
          </svg>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 lg:h-[300px] lg:w-[300px]"
        >
          <svg viewBox="0 0 300 300" className="orbit-ring-inner h-full w-full">
            <circle
              cx="150"
              cy="150"
              r="148"
              fill="none"
              stroke="var(--secondary)"
              strokeOpacity={0.26}
              strokeWidth="1.5"
              strokeDasharray="1 10"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Layer 5: floating telemetry cards */}
        <TelemetryCard
          label="Form Score"
          value="92%"
          tone="success"
          floatDelay={0}
          reduced={reduced}
          style={reduced ? undefined : { x: cardX, y: cardY }}
          className="absolute left-4 top-6 lg:left-6 lg:top-10"
        />
        <TelemetryCard
          label="Range"
          value="+12°"
          tone="secondary"
          icon={<MoveDiagonal className="h-4 w-4 text-secondary" aria-hidden="true" />}
          floatDelay={0.7}
          reduced={reduced}
          style={reduced ? undefined : { x: cardX, y: cardY }}
          className="absolute right-4 top-1/3 lg:right-6"
        />
        <TelemetryCard
          label="Voice"
          value="Listening"
          tone="primary"
          icon={<AudioWaveform className="h-4 w-4 text-primary" aria-hidden="true" />}
          floatDelay={1.4}
          reduced={reduced}
          style={reduced ? undefined : { x: cardX, y: cardY }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 lg:bottom-8"
        />

        {/* Keyboard-focus description panel (shell.md §5.4) */}
        {descVisible && (
          <div className="glass-overlay absolute inset-x-4 bottom-4 rounded-2xl p-3 text-sm text-foreground">
            Body Halo preview: a stylized body map shows alignment, form score,
            range, and voice readiness.
          </div>
        )}
      </div>
    </motion.div>
  );
}
