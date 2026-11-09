import * as React from 'react';

/**
 * BrandMark — inline SVG version of the `/assets/adaptifit-mark.svg`
 * spec (design.md §12): an adaptive orbit ring combined with a stylized
 * human joint/leaf. Emerald-to-teal line work, rounded strokes, legible
 * at 24px. Inline SVG keeps it themeable via currentColor-free brand
 * gradient and avoids a public/ asset dependency.
 */

export interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 36, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="adaptifit-mark-gradient"
          x1="64"
          y1="64"
          x2="448"
          y2="448"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#59E3A9" />
          <stop offset="1" stopColor="#63D6C5" />
        </linearGradient>
      </defs>
      {/* Adaptive orbit ring */}
      <circle
        cx="256"
        cy="256"
        r="176"
        stroke="url(#adaptifit-mark-gradient)"
        strokeWidth="28"
        strokeLinecap="round"
        strokeDasharray="720 150"
        strokeDashoffset="40"
      />
      <circle
        cx="256"
        cy="256"
        r="176"
        stroke="url(#adaptifit-mark-gradient)"
        strokeWidth="28"
        strokeLinecap="round"
        strokeDasharray="150 955"
        strokeDashoffset="-640"
        opacity="0.55"
      />
      {/* Stylized joint/leaf figure */}
      <circle cx="256" cy="176" r="34" fill="url(#adaptifit-mark-gradient)" />
      <path
        d="M256 232 C 210 262, 196 316, 214 366 C 226 400, 254 414, 284 402 C 322 386, 332 336, 312 296"
        stroke="url(#adaptifit-mark-gradient)"
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
      />
      {/* Orbit node */}
      <circle cx="408" cy="152" r="26" fill="#F0C66B" />
    </svg>
  );
}
