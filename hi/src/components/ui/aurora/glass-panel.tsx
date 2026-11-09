'use client';

/**
 * GlassPanel — the Clinical Aurora glass recipe (design.md §8.2, §10.2).
 *
 * variant="card"    → standard glass card (surface 82%, blur 18px, shadow-md)
 * variant="overlay" → heavy overlay glass (dialogs, sheets, chat panels)
 * interactive       → adds hover lift + primary border glow (motion-gated)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReduced, SPRING } from './motion';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'overlay';
  interactive?: boolean;
  /** Card radius — design.md §10.2 default is 24px (xl) */
  radius?: 'md' | 'lg' | 'xl' | '2xl';
}

const RADIUS = {
  md: 'rounded-[14px]',
  lg: 'rounded-[18px]',
  xl: 'rounded-[24px]',
  '2xl': 'rounded-[32px]',
} as const;

export function GlassPanel({
  variant = 'card',
  interactive = false,
  radius = 'xl',
  className,
  children,
  ...props
}: GlassPanelProps) {
  const reduced = useReduced();

  const cls = cn(
    variant === 'overlay' ? 'glass-overlay' : 'glass-panel',
    RADIUS[radius],
    interactive &&
      'transition-[border-color] duration-300 hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)]',
    className,
  );

  if (interactive) {
    return (
      <motion.div
        className={cls}
        whileHover={reduced ? undefined : { y: -4, scale: 1.015 }}
        whileTap={reduced ? undefined : { scale: 0.985 }}
        transition={SPRING.snappy}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
