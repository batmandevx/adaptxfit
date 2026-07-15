import type { CSSProperties } from 'react';
import type { Exercise } from '../types';

// ===========================================================================
// Adaptive Motion Sketch — a rough, animated movement guide (NOT a medical
// body model). The figure's limbs are grouped so CSS can animate the relevant
// joint per exercise. All motion is disabled automatically under reduced motion.
// ===========================================================================

export type SketchAnimation =
  | 'arm-reach'
  | 'arm-pull'
  | 'arm-press'
  | 'arm-curl'
  | 'punch'
  | 'shoulder-roll'
  | 'neck-tilt'
  | 'torso-rotate'
  | 'side-bend'
  | 'knee-lift'
  | 'march'
  | 'heel-raise'
  | 'leg-side'
  | 'leg-back'
  | 'sit-stand'
  | 'calf-raise'
  | 'none';

const ANIMATION_BY_ID: Record<string, SketchAnimation> = {
  'seated-band-row': 'arm-pull',
  'seated-band-chest-press': 'arm-press',
  'seated-band-pulldown': 'arm-pull',
  'seated-band-curl': 'arm-curl',
  'seated-punches': 'punch',
  'seated-forward-reach': 'arm-reach',
  'seated-shoulder-circles': 'shoulder-roll',
  'seated-neck-release': 'neck-tilt',
  'seated-ankle-wrist-circles': 'shoulder-roll',
  'seated-core-rotation': 'torso-rotate',
  'seated-side-bend': 'side-bend',
  'seated-knee-lift-core': 'knee-lift',
  'seated-boxing-combo': 'punch',
  'seated-march': 'march',
  'seated-heel-raise': 'heel-raise',
  'seated-knee-extension': 'knee-lift',
  'seated-hip-circles': 'leg-side',
  'wall-push': 'arm-press',
  'one-arm-wall-press': 'arm-press',
  'chair-sit-to-stand': 'sit-stand',
  'chair-supported-calf-raise': 'calf-raise',
  'standing-hip-abduction': 'leg-side',
  'standing-hip-extension': 'leg-back',
  'standing-supported-knee-lift': 'knee-lift',
  'standing-band-row': 'arm-pull',
  'marching-in-place': 'march',
  'bodyweight-squat': 'sit-stand',
  'forward-lunge': 'sit-stand',
  'standard-pushup': 'arm-press',
  'floor-plank': 'none',
};

const FALLBACK_BY_REGION: Record<Exercise['focusRegion'], SketchAnimation> = {
  upper: 'arm-reach',
  lower: 'march',
  core: 'torso-rotate',
  mobility: 'shoulder-roll',
  full: 'punch',
};

export function animationForExercise(exercise: Pick<Exercise, 'id' | 'focusRegion'>): SketchAnimation {
  return ANIMATION_BY_ID[exercise.id] ?? FALLBACK_BY_REGION[exercise.focusRegion];
}

interface MotionSketchProps {
  posture: Exercise['posture'];
  focusRegion: Exercise['focusRegion'];
  usesWheelchair: boolean;
  visualDescription: string;
  animation?: SketchAnimation;
  /** Play the looping movement animation (disabled automatically by reduced motion). */
  animated?: boolean;
  /** Approximate avatar sizing from the optional body scan. */
  body?: { heightScale: number; buildScale: number };
  /** Compact mode hides the caption (used inside dense lists). */
  compact?: boolean;
}

function Highlight({ cx, cy, rx = 20, ry = 20 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--accent)" opacity="0.16" />;
}

function highlightFor(region: Exercise['focusRegion'], seated: boolean) {
  switch (region) {
    case 'upper':
      return <Highlight cx={60} cy={seated ? 54 : 48} rx={26} ry={16} />;
    case 'core':
      return <Highlight cx={59} cy={seated ? 70 : 64} rx={20} ry={18} />;
    case 'lower':
      return seated ? <Highlight cx={70} cy={100} rx={24} ry={18} /> : <Highlight cx={58} cy={104} rx={24} ry={20} />;
    case 'full':
      return <Highlight cx={59} cy={seated ? 64 : 60} rx={30} ry={34} />;
    case 'mobility':
    default:
      return <Highlight cx={60} cy={seated ? 50 : 44} rx={28} ry={14} />;
  }
}

const o = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 3.4,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Rough seated / wheelchair figure with animatable limb groups. */
function SeatedFigure({ wheelchair }: { wheelchair: boolean }) {
  return (
    <g {...stroke}>
      {/* chair / wheelchair frame (static) */}
      {wheelchair ? (
        <g stroke="var(--text-faint)" strokeWidth={3}>
          <circle cx={84} cy={104} r={20} />
          <circle cx={84} cy={104} r={4} fill="var(--text-faint)" />
          <line x1={70} y1={90} x2={98} y2={118} />
          <line x1={98} y1={90} x2={70} y2={118} />
          <circle cx={50} cy={116} r={7} />
          <line x1={46} y1={88} x2={46} y2={116} />
        </g>
      ) : (
        <g stroke="var(--text-faint)" strokeWidth={3}>
          <line x1={44} y1={86} x2={44} y2={120} />
          <line x1={44} y1={86} x2={94} y2={86} />
          <line x1={94} y1={86} x2={94} y2={120} />
          <line x1={44} y1={60} x2={44} y2={86} />
        </g>
      )}

      <g className="amg-body" style={o(59, 90)}>
        <g className="amg-trunk" style={o(58, 86)}>
          <g className="amg-head" style={o(60, 46)}>
            <circle cx={60} cy={34} r={11} fill="var(--surface)" />
            <line x1={60} y1={45} x2={60} y2={52} />
          </g>
          <line x1={59} y1={52} x2={58} y2={86} />
          <g className="amg-arm amg-arm-l" style={o(59, 56)}>
            <line x1={59} y1={56} x2={40} y2={73} />
          </g>
          <g className="amg-arm amg-arm-r" style={o(59, 56)}>
            <line x1={59} y1={56} x2={80} y2={71} />
          </g>
        </g>
        <g className="amg-leg amg-leg-l" style={o(56, 86)}>
          <polyline points="56,86 45,93 45,114" />
          <g className="amg-foot" style={o(45, 114)}>
            <line x1={45} y1={114} x2={55} y2={114} />
          </g>
        </g>
        <g className="amg-leg amg-leg-r" style={o(60, 86)}>
          <polyline points="60,86 80,90 82,114" />
          <g className="amg-foot" style={o(82, 114)}>
            <line x1={82} y1={114} x2={92} y2={114} />
          </g>
        </g>
      </g>
    </g>
  );
}

function StandingFigure({ supported }: { supported: boolean }) {
  return (
    <g {...stroke}>
      {supported ? (
        <g stroke="var(--text-faint)" strokeWidth={3}>
          <line x1={98} y1={56} x2={98} y2={126} />
          <line x1={90} y1={56} x2={106} y2={56} />
        </g>
      ) : null}

      <g className="amg-body" style={o(56, 84)}>
        <g className="amg-trunk" style={o(56, 84)}>
          <g className="amg-head" style={o(56, 37)}>
            <circle cx={56} cy={26} r={11} fill="var(--surface)" />
            <line x1={56} y1={37} x2={56} y2={40} />
          </g>
          <line x1={56} y1={40} x2={56} y2={84} />
          <g className="amg-arm amg-arm-l" style={o(56, 49)}>
            <line x1={56} y1={49} x2={40} y2={70} />
          </g>
          <g className="amg-arm amg-arm-r" style={o(56, 49)}>
            <line x1={56} y1={49} x2={supported ? 96 : 74} y2={supported ? 62 : 70} />
          </g>
        </g>
        <g className="amg-leg amg-leg-l" style={o(56, 84)}>
          <line x1={56} y1={84} x2={46} y2={122} />
          <g className="amg-foot" style={o(46, 122)}>
            <line x1={46} y1={122} x2={56} y2={122} />
          </g>
        </g>
        <g className="amg-leg amg-leg-r" style={o(56, 84)}>
          <line x1={56} y1={84} x2={68} y2={122} />
          <g className="amg-foot" style={o(68, 122)}>
            <line x1={68} y1={122} x2={78} y2={122} />
          </g>
        </g>
      </g>
    </g>
  );
}

export function MotionSketch({
  posture,
  focusRegion,
  usesWheelchair,
  visualDescription,
  animation = 'none',
  animated = true,
  body,
  compact,
}: MotionSketchProps) {
  const seated = posture === 'seated';
  const supported = posture === 'standing-supported';
  const heightScale = body?.heightScale ?? 1;
  const buildScale = body?.buildScale ?? 1;

  return (
    <figure
      className={`motion-sketch ${animated ? 'motion-sketch--play' : ''}`}
      data-anim={animated ? animation : undefined}
      style={{ margin: 0, color: 'var(--primary-strong)' }}
    >
      <svg viewBox="0 0 120 140" role="img" aria-label={`Movement guide: ${visualDescription}`}>
        {highlightFor(focusRegion, seated)}
        <g
          style={{
            transformBox: 'view-box',
            transformOrigin: '60px 122px',
            transform: `scale(${buildScale}, ${heightScale})`,
          }}
        >
          {seated ? <SeatedFigure wheelchair={usesWheelchair} /> : <StandingFigure supported={supported} />}
        </g>
      </svg>
      {!compact ? (
        <figcaption className="sketch-caption">Rough movement guide — not a medical body model.</figcaption>
      ) : null}
      <span className="visually-hidden">{visualDescription}</span>
    </figure>
  );
}
