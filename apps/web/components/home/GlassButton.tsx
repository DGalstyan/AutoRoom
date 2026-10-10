'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The tall dark "glass" pill used on the black bands (Figma `BTN` instances at
 * 231×108): a vertical #060606→#141414 gradient with a 1px highlight along the
 * top and bottom edges that is brightest in the middle and fades towards the
 * ends — drawn with two inset shadows, which follow the pill's curvature.
 */
const CLASSES =
  'group inline-flex h-16 max-w-full min-w-[160px] shrink-0 items-center text-center sm:whitespace-nowrap justify-center gap-1 rounded-pill ' +
  'bg-gradient-to-b from-[#060606] to-neutral-900 px-8 text-[20px] leading-7 text-white ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-1px_0_rgba(255,255,255,0.28)] ' +
  'transition-[background,box-shadow,transform] duration-standard ease-expo ' +
  'hover:from-[#111] hover:to-[#1c1c1c] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(255,255,255,0.45)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ' +
  'sm:h-[108px] sm:min-w-[231px] sm:px-6';

export function GlassButton({
  children,
  onClick,
  href,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      {children}
      <span
        aria-hidden="true"
        className="flex size-[34px] shrink-0 items-center justify-center transition-transform duration-standard ease-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 17 17 7M17 7H8.5M17 7v8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`${CLASSES} ${className}`}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${CLASSES} ${className}`}>
      {content}
    </button>
  );
}
