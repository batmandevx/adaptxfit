'use client';

/**
 * Clinical Aurora motion tokens (design.md §9).
 * Shared by the shell and all surface agents so every animation uses the
 * same easings, springs, durations, and reduced-motion variants.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useAccessibilityStore } from '@/stores/accessibility-store';

/**
 * Stricter of OS preference and the in-app accessibility toggle wins.
 * Hydration-safe: returns `false` during SSR and the first client render
 * (so server/client markup always matches), then reflects the real setting
 * from mount onward.
 */
export function useReduced(): boolean {
  const prefersReduced = useReducedMotion();
  const appReduced = useAccessibilityStore((s) => s.reducedMotion);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted && Boolean(prefersReduced || appReduced);
}

/** Easing curves (design.md §9.2) */
export const EASE = {
  careOut: [0.16, 1, 0.3, 1] as const,
  standard: [0.2, 0, 0, 1] as const,
  emphasis: [0.83, 0, 0.17, 1] as const,
};

/** Springs (design.md §9.2) */
export const SPRING = {
  soft: { type: 'spring', stiffness: 180, damping: 24, mass: 0.9 } as const,
  snappy: { type: 'spring', stiffness: 320, damping: 28, mass: 0.7 } as const,
  gentle: { type: 'spring', stiffness: 120, damping: 18, mass: 1 } as const,
};

/** Durations in seconds (design.md §9.3) */
export const DURATION = {
  instant: 0.1,
  micro: 0.16,
  standard: 0.24,
  expressive: 0.42,
  page: 0.32,
  long: 0.7,
};

/** Section entrance (design.md §9.4) */
export const sectionEntrance = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: DURATION.expressive, ease: EASE.careOut },
} as const;

/** Staggered cards (design.md §9.4) */
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.page, ease: EASE.careOut },
  },
} as const;

/** Hover lift (design.md §9.4) — apply only when NOT reduced */
export const hoverLift = {
  whileHover: { y: -4, scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: SPRING.snappy,
} as const;

/** Panel entrance (design.md §9.4) */
export const panelEntrance = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.98 },
  transition: SPRING.soft,
} as const;

/** Reduced-motion variants (design.md §9.5): opacity only, 120–160ms */
export const reducedItem = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.14, ease: 'linear' } },
} as const;

export const reducedFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14, ease: 'linear' } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: 'linear' } },
} as const;
