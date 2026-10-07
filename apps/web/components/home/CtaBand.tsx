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
}: {
  heading: ReactNode;
  sub?: ReactNode;
  buttonLabel: string;
  onClick?: () => void;
  href?: string;
}) {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-14 sm:px-6 lg:h-[336px] lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-0">
        <Reveal className="max-w-[995px]">
          <h2 className="stretch-88 text-[28px] font-light leading-[38px] sm:text-home-h2 sm:leading-[58px]">
            {heading}
          </h2>
          {sub && (
            <p className="stretch-85 mt-2 text-[20px] font-normal leading-[30px] sm:text-[28px] sm:leading-[40px] lg:text-[36px] lg:leading-[48px]">
              {sub}
            </p>
          )}
        </Reveal>
        <Reveal delayMs={120}>
          <GlassButton onClick={onClick} href={href}>
            {buttonLabel}
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}
