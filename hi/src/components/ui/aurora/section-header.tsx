'use client';

/**
 * SectionHeader — eyebrow + title + description (+ optional right-side
 * actions), per design.md §10.3. Animates in with the section-entrance
 * pattern; reduced motion renders opacity-only.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReduced, sectionEntrance, reducedFade } from './motion';

export interface SectionHeaderProps {
  /** 12px uppercase, tracking 0.12em, primary — e.g. "HOW ADAPTIFIT WORKS" */
  eyebrow: string;
  /** 30–38px Sora 700 */
  title: React.ReactNode;
  /** 16–18px Inter, max-width 760px */
  description?: React.ReactNode;
  /** Optional right-side action group (aligns baseline on desktop, stacks on mobile) */
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  const reduced = useReduced();

  const motionProps = reduced
    ? {
        initial: reducedFade.initial,
        whileInView: reducedFade.animate,
        viewport: { once: true, amount: 0.2 },
      }
    : {
        initial: sectionEntrance.initial,
        whileInView: sectionEntrance.whileInView,
        viewport: sectionEntrance.viewport,
        transition: sectionEntrance.transition,
      };

  return (
    <motion.div
      {...(motionProps as React.ComponentProps<typeof motion.div>)}
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-[760px]">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          <span aria-hidden="true" className="inline-block h-px w-5 bg-primary" />
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base sm:text-lg text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 md:pb-1">{actions}</div>
      ) : null}
    </motion.div>
  );
}
