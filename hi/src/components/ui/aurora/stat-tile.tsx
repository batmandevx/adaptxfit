'use client';

/**
 * StatTile — metric tile per design.md §10.2.
 * Min height 136px, padding 20px, 40px icon capsule, 13px uppercase label,
 * 30px mono/display value, optional 12px delta chip, optional sparkline
 * rendered behind content at 18% opacity (never behind text without scrim).
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { GlassPanel } from './glass-panel';

export type StatTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const TONE_CAPSULE: Record<StatTone, string> = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export interface StatTileProps {
  icon: React.ReactNode;
  /** Rendered uppercase, 13px, tracking 0.08em */
  label: string;
  /** Large value — rendered in the numeric/mono stack */
  value: React.ReactNode;
  /** Small delta chip, e.g. "+4% this week" */
  delta?: React.ReactNode;
  deltaTone?: StatTone;
  tone?: StatTone;
  /** Decorative sparkline; sits behind content at 18% opacity */
  sparkline?: React.ReactNode;
  className?: string;
}

export function StatTile({
  icon,
  label,
  value,
  delta,
  deltaTone = 'success',
  tone = 'primary',
  sparkline,
  className,
}: StatTileProps) {
  return (
    <GlassPanel
      className={cn('relative min-h-[136px] overflow-hidden p-5', className)}
    >
      {sparkline ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.18]"
        >
          {sparkline}
        </div>
      ) : null}
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              TONE_CAPSULE[tone],
            )}
          >
            {icon}
          </span>
          {delta ? (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                TONE_CAPSULE[deltaTone],
              )}
            >
              {delta}
            </span>
          ) : null}
        </div>
        <div className="mt-auto">
          <p className="text-[30px] leading-[36px] font-semibold font-mono tabular-nums text-foreground">
            {value}
          </p>
          <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground-subtle">
            {label}
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
