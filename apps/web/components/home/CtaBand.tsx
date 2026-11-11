'use client';

import type { ReactNode } from 'react';
import { GlassButton } from '@/components/home/GlassButton';
import { Reveal } from '@/components/ui/Reveal';

/**
 * The full-bleed black call-to-action band (Figma `Text` frames, 1440×336):
 * a 44px light heading — optionally with a 36px sub-line — on the left and the
 * glass button on the right, inside the 1344px column.
 */
export function CtaBand({
  heading,
  sub,
  buttonLabel,
  onClick,
  href,
  padded = false,
  buttonTone = 'accent',
  variant = 'band',
}: {
  heading: ReactNode;
  sub?: ReactNode;
  buttonLabel: string;
  onClick?: () => void;
  href?: string;
  /** Grow with the copy (80px above and below) instead of the fixed 336px band — for a long sub-line. */
  padded?: boolean;
  /** `glass` is the dark outlined pill (the Offers band); `accent` the gold one. */
  buttonTone?: 'glass' | 'accent';
  /**
   * `card` is the closing call-to-action of Figma 471:1126: the same copy and button inside a 1344px
   * black card with a 48px radius and a 6px gold edge that fades to black along the width, instead of
   * the full-bleed black band.
   */
  variant?: 'band' | 'card';
}) {
  if (variant === 'card') {
    return (
      <section className="mx-auto max-w-page px-4 sm:px-6 lg:px-12">
        <div
          className="flex flex-col gap-8 rounded-[48px] border-[6px] border-transparent px-6 py-14 text-white lg:flex-row lg:items-center lg:gap-9 lg:h-[336px] lg:px-[42px] lg:py-0"
          style={{
            background:
              'linear-gradient(#0d0d0d, #0d0d0d) padding-box, linear-gradient(90deg, #c8a24a 0%, #c8a24a 25%, #000 100%) border-box',
          }}
        >
          <Reveal className="lg:min-w-0 lg:flex-1">
            <h2 className="type-h2">{heading}</h2>
            {sub && (
              <p className="stretch-85 mt-2 text-[20px] font-normal leading-[30px] sm:text-[28px] sm:leading-[40px] lg:text-[36px] lg:leading-[48px]">
                {sub}
              </p>
            )}
          </Reveal>
          <GlassButton
            tone={buttonTone === 'accent' ? 'glass' : buttonTone}
            onClick={onClick}
            href={href}
          >
            {buttonLabel}
          </GlassButton>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ink text-white">
      <div
        className={`mx-auto flex max-w-page flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 ${padded ? 'lg:py-20' : 'lg:h-[336px] lg:py-0'}`}
      >
        <Reveal className="lg:min-w-0 lg:flex-1 lg:max-w-[1060px]">
          <h2 className="type-h2">{heading}</h2>
          {sub && (
            <p className="stretch-85 mt-2 text-[20px] font-normal leading-[30px] sm:text-[28px] sm:leading-[40px] lg:text-[36px] lg:leading-[48px]">
              {sub}
            </p>
          )}
        </Reveal>
        {/* Not wrapped in a fade-in: the button must be there as soon as the band is. */}
        <GlassButton tone={buttonTone} onClick={onClick} href={href}>
          {buttonLabel}
        </GlassButton>
      </div>
    </section>
  );
}
