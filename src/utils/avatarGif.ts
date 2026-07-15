import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { SketchAnimation } from '../components/MotionSketch';

// ===========================================================================
// Movement GIF generator. Renders the stylised, personalised avatar through one
// loop of an exercise's movement on a canvas, then encodes a real animated GIF.
// This is a rough motion guide — never a medical or photoreal body model.
// ===========================================================================

export interface AvatarOptions {
  posture: 'seated' | 'standing' | 'standing-supported';
  wheelchair: boolean;
  heightScale: number;
  buildScale: number;
  animation: SketchAnimation;
  colors: { stroke: string; faint: string; surface: string };
}

interface Angles {
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  trunk: number;
  head: number;
  foot: number;
  bodyTY: number;
}

/** Per-frame joint angles (degrees) / body offset for a given animation + phase. */
function frameAngles(animation: SketchAnimation, t: number): Angles {
  const a: Angles = { armL: 0, armR: 0, legL: 0, legR: 0, trunk: 0, head: 0, foot: 0, bodyTY: 0 };
  const peak = Math.sin(Math.PI * t); // 0 → 1 → 0 (ease in/out)
  const osc = Math.sin(2 * Math.PI * t); // 0 → +1 → 0 → -1 → 0 (both directions)
  const altR = t < 0.5 ? Math.sin(Math.PI * (t / 0.5)) : 0;
  const altL = t >= 0.5 ? Math.sin(Math.PI * ((t - 0.5) / 0.5)) : 0;

  switch (animation) {
    case 'arm-reach': a.armR = -22 * peak; a.armL = 22 * peak; break;
    case 'arm-pull': a.armR = 24 * peak; a.armL = -24 * peak; break;
    case 'arm-press': a.armR = -26 * peak; a.armL = 26 * peak; break;
    case 'arm-curl': a.armR = -48 * peak; a.armL = 48 * peak; break;
    case 'punch': a.armR = -34 * altR; a.armL = 34 * altL; break;
    case 'shoulder-roll': a.armR = -14 * peak; a.armL = 14 * peak; break;
    case 'neck-tilt': a.head = 12 * osc; break;
    case 'torso-rotate': a.trunk = 9 * osc; break;
    case 'side-bend': a.trunk = 12 * osc; break;
    case 'knee-lift': a.legR = -34 * peak; break;
    case 'march': a.legR = -30 * altR; a.legL = 30 * altL; break;
    case 'heel-raise': a.foot = -22 * peak; break;
    case 'leg-side': a.legR = 26 * peak; break;
    case 'leg-back': a.legR = 16 * peak; break;
    case 'sit-stand': a.bodyTY = 10 * peak; break;
    case 'calf-raise': a.bodyTY = -6 * peak; break;
    default: break;
  }
  return a;
}

function rot(ctx: CanvasRenderingContext2D, px: number, py: number, deg: number) {
  ctx.translate(px, py);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-px, -py);
}
function seg(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function poly(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}
function circleFill(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, line: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.stroke();
}

function drawSeatedLeg(ctx: CanvasRenderingContext2D, side: 'L' | 'R', legDeg: number, footDeg: number) {
  const hip: [number, number] = side === 'L' ? [56, 86] : [60, 86];
  const path: [number, number][] = side === 'L' ? [[56, 86], [45, 93], [45, 114]] : [[60, 86], [80, 90], [82, 114]];
  const toe: [number, number] = side === 'L' ? [45, 114] : [82, 114];
  const footEnd: [number, number] = side === 'L' ? [55, 114] : [92, 114];
  ctx.save();
  rot(ctx, hip[0], hip[1], legDeg);
  poly(ctx, path);
  ctx.save();
  rot(ctx, toe[0], toe[1], footDeg);
  seg(ctx, toe[0], toe[1], footEnd[0], footEnd[1]);
  ctx.restore();
  ctx.restore();
}

function drawStandingLeg(ctx: CanvasRenderingContext2D, side: 'L' | 'R', legDeg: number, footDeg: number) {
  const hip: [number, number] = [56, 84];
  const foot: [number, number] = side === 'L' ? [46, 122] : [68, 122];
  const footEnd: [number, number] = side === 'L' ? [56, 122] : [78, 122];
  ctx.save();
  rot(ctx, hip[0], hip[1], legDeg);
  seg(ctx, hip[0], hip[1], foot[0], foot[1]);
  ctx.save();
  rot(ctx, foot[0], foot[1], footDeg);
  seg(ctx, foot[0], foot[1], footEnd[0], footEnd[1]);
  ctx.restore();
  ctx.restore();
}

/** Draw a single avatar frame in 120×140 user units (context pre-scaled). */
export function drawAvatarFrame(ctx: CanvasRenderingContext2D, o: AvatarOptions, t: number) {
  const a = frameAngles(o.animation, t);
  ctx.clearRect(0, 0, 120, 140);
  ctx.fillStyle = o.colors.surface || '#ffffff';
  ctx.fillRect(0, 0, 120, 140);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.save();
  ctx.translate(0, a.bodyTY);
  ctx.translate(60, 122);
  ctx.scale(o.buildScale, o.heightScale);
  ctx.translate(-60, -122);

  const seated = o.posture === 'seated';

  // chair / support
  ctx.strokeStyle = o.colors.faint;
  ctx.lineWidth = 3;
  if (seated && o.wheelchair) {
    ctx.beginPath();
    ctx.arc(84, 104, 20, 0, Math.PI * 2);
    ctx.stroke();
    seg(ctx, 70, 90, 98, 118);
    seg(ctx, 98, 90, 70, 118);
    ctx.beginPath();
    ctx.arc(50, 116, 7, 0, Math.PI * 2);
    ctx.stroke();
    seg(ctx, 46, 88, 46, 116);
  } else if (seated) {
    seg(ctx, 44, 86, 44, 120);
    seg(ctx, 44, 86, 94, 86);
    seg(ctx, 94, 86, 94, 120);
    seg(ctx, 44, 60, 44, 86);
  } else if (o.posture === 'standing-supported') {
    seg(ctx, 98, 56, 98, 126);
    seg(ctx, 90, 56, 106, 56);
  }

  ctx.strokeStyle = o.colors.stroke;
  ctx.lineWidth = 3.4;

  if (seated) {
    ctx.save();
    rot(ctx, 58, 86, a.trunk);
    ctx.save();
    rot(ctx, 60, 46, a.head);
    circleFill(ctx, 60, 34, 11, o.colors.surface, o.colors.stroke);
    seg(ctx, 60, 45, 60, 52);
    ctx.restore();
    seg(ctx, 59, 52, 58, 86);
    ctx.save();
    rot(ctx, 59, 56, a.armL);
    seg(ctx, 59, 56, 40, 73);
    ctx.restore();
    ctx.save();
    rot(ctx, 59, 56, a.armR);
    seg(ctx, 59, 56, 80, 71);
    ctx.restore();
    ctx.restore();
    drawSeatedLeg(ctx, 'L', a.legL, a.foot);
    drawSeatedLeg(ctx, 'R', a.legR, a.foot);
  } else {
    const rHandX = o.posture === 'standing-supported' ? 96 : 74;
    const rHandY = o.posture === 'standing-supported' ? 62 : 70;
    ctx.save();
    rot(ctx, 56, 84, a.trunk);
    ctx.save();
    rot(ctx, 56, 37, a.head);
    circleFill(ctx, 56, 26, 11, o.colors.surface, o.colors.stroke);
    seg(ctx, 56, 37, 56, 40);
    ctx.restore();
    seg(ctx, 56, 40, 56, 84);
    ctx.save();
    rot(ctx, 56, 49, a.armL);
    seg(ctx, 56, 49, 40, 70);
    ctx.restore();
    ctx.save();
    rot(ctx, 56, 49, a.armR);
    seg(ctx, 56, 49, rHandX, rHandY);
    ctx.restore();
    ctx.restore();
    drawStandingLeg(ctx, 'L', a.legL, a.foot);
    drawStandingLeg(ctx, 'R', a.legR, a.foot);
  }

  ctx.restore();
}

export interface GifResult {
  url: string;
  blob: Blob;
}

/** Render one movement loop and encode it as an animated GIF. */
export async function generateMovementGif(o: AvatarOptions): Promise<GifResult> {
  const scale = 2;
  const W = 120 * scale;
  const H = 140 * scale;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.scale(scale, scale);

  const frames = 24;
  const delay = Math.round(2200 / frames);
  const gif = GIFEncoder();

  for (let i = 0; i < frames; i += 1) {
    drawAvatarFrame(ctx, o, i / frames);
    const { data } = ctx.getImageData(0, 0, W, H);
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    gif.writeFrame(indexed, W, H, { palette, delay });
    // Yield occasionally so the UI stays responsive.
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  // Copy into a fresh ArrayBuffer-backed array so it is a valid BlobPart.
  const blob = new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' });
  return { url: URL.createObjectURL(blob), blob };
}
