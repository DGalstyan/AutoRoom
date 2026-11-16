'use client';

import Image from 'next/image';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';

/** Where the machine render sits inside its card box and how the 1024×1024 source is cropped (all % of the design box). */
export interface MachineryArt {
  src: string;
  /** Render box, in px of the Figma 593×546 (left) / 591×546 (right) card wrapper. */
  box: { x: number; y: number; w: number; h: number };
  /** Crop of the square source inside the box (Figma fill offsets); omit to cover the box. */
  crop?: { h: number; l: number; t: number; w: number };
  flip?: boolean;
}

interface MachineryCardProps {
  name: string;
  badge: string;
  requestLabel: string;
  side: 'left' | 'right';
  art: MachineryArt;
  /** The first two cards sit in the first viewport. */
  priority?: boolean;
}

const WRAP_W = { left: 593, right: 591 } as const;
const WRAP_H = 546;

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

/**
 * One machine tile of `/china/machinery` — Figma "Shin Tech" (left, 503:703) and
 * "Shin Tech left" (right, 503:730) instances: a 48px-radius white card, the name and
 * a 64px arrow disc on top, the "Պատվերով" pill bottom corner, and the render breaking
 * out of the card's lower edge. Everything scales with the wrapper's width, so the
 * 1344px desktop layout is exact and narrower screens shrink proportionally.
 */
export function MachineryCard({
  name,
  badge,
  requestLabel,
  side,
  art,
  priority = false,
}: MachineryCardProps) {
  const { openUniversal } = useLeadWidgets();
  const wrapW = WRAP_W[side];
  const isLeft = side === 'left';
  const { box, crop } = art;
  const open = () =>
    openUniversal({
      sourceCta: 'china-machinery-card',
      preselect: { interest: 'machinery' },
    });

  return (
    <div
      className="group relative w-full"
      style={{ aspectRatio: `${wrapW}/${WRAP_H}`, maxWidth: wrapW }}
    >
      {/* The white card: 533×542 of the 593×546 wrapper, flush to the outer edge. */}
      <button
        type="button"
        aria-label={requestLabel.replace('{name}', name)}
        onClick={open}
        className="absolute cursor-pointer rounded-[48px] bg-white text-left transition-shadow duration-standard ease-expo group-hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{
          top: 0,
          bottom: pct(4, WRAP_H),
          left: isLeft ? 0 : pct(58.9, wrapW),
          right: isLeft ? pct(59.75, wrapW) : '-0.04%',
        }}
      >
        <span className="absolute inset-x-[23px] top-6 flex items-center justify-between gap-4">
          <span className="font-display text-[24px] font-bold leading-9 text-neutral-800">
            {name}
          </span>
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[rgba(127,127,127,0.1)] text-ink transition-colors duration-standard group-hover:bg-accent"
          >
            <ArrowGlyph />
          </span>
        </span>
        <span
          className={`absolute bottom-7 inline-flex items-center rounded-full border border-neutral-800 bg-white/10 p-2.5 text-[16px] leading-6 text-neutral-800 ${
            isLeft ? 'left-6' : 'right-[23px]'
          }`}
        >
          {badge}
        </span>
      </button>

      <div
        aria-hidden="true"
        // The render is part of the card: hovering or clicking it acts like the card itself
        // (keyboard users have the button above).
        onClick={open}
        className="absolute cursor-pointer"
        style={{
          left: pct(box.x, wrapW),
          top: pct(box.y, WRAP_H),
          width: pct(box.w, wrapW),
          height: pct(box.h, WRAP_H),
          transform: art.flip ? 'scaleX(-1)' : undefined,
        }}
      >
        <div className="absolute inset-0 origin-bottom transition-transform duration-standard ease-expo group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          {crop ? (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={art.src}
                alt=""
                width={1024}
                height={1024}
                priority={priority}
                sizes="(min-width: 1024px) 34vw, 90vw"
                className="absolute max-w-none"
                style={{
                  height: `${crop.h}%`,
                  left: `${crop.l}%`,
                  top: `${crop.t}%`,
                  width: `${crop.w}%`,
                }}
              />
            </div>
          ) : (
            <Image
              src={art.src}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 34vw, 90vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Iconly "Arrow - Up" turned 45°, as drawn in the Figma disc (40.5px box, 28.7px glyph). */
function ArrowGlyph() {
  return (
    <svg width="29" height="29" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M4 12 12 4M12 4H5M12 4v7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
