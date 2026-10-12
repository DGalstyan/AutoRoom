'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

/**
 * "Մեքենայի ճանապարհը՝ ընտրությունից մինչև հանձնում" — Figma 436:1910/2104.
 * Seven 564px-tall photo cards in a 1344px row: the active one is 452px wide and
 * carries the step's title + description, the others are 141px strips with just
 * their label at the bottom. Hover/focus/tap makes any strip the active one (the
 * width change animates). Every card ends in a bottom-heavy black gradient.
 *
 * Below 1400px the strip becomes a swipeable row of cards (scroll-snap, the next card peeking
 * in) instead of seven full-width cards stacked — that was ~2,000px of phone scroll. Each card
 * keeps its copy visible, on a dark panel so it reads over any photo. The accordion's 96–141px
 * strips clip their titles and need hover, so it is kept for the width the design was drawn at.
 */
export function JourneyStrip({
  heading,
  steps,
}: {
  heading: string;
  steps: { title: string; text: string }[];
}) {
  const [active, setActive] = useState(0);
  const [page, setPage] = useState(0);
  const rowRef = useRef<HTMLOListElement>(null);

  /** Which card is in view in the swipeable row (below 1400px), for the dots. */
  function onRowScroll() {
    const row = rowRef.current;
    const first = row?.firstElementChild as HTMLElement | null;
    if (!row || !first) return;
    const step = first.offsetWidth + 12;
    setPage(Math.min(steps.length - 1, Math.max(0, Math.round(row.scrollLeft / step))));
  }

  return (
    <div className="flex flex-col gap-8 min-[1400px]:gap-[64px]">
      <h2 className="type-h2 text-ink">{heading}</h2>

      <ol
        ref={rowRef}
        onScroll={onRowScroll}
        aria-label={heading}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 min-[1400px]:mx-0 min-[1400px]:h-[564px] min-[1400px]:flex-row min-[1400px]:gap-[7px] min-[1400px]:overflow-visible min-[1400px]:px-0 min-[1400px]:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, index) => {
          const isActive = index === active;
          return (
            <li
              key={step.title}
              className={`group relative overflow-hidden rounded-[32px] bg-black transition-[flex-grow] duration-[600ms] ease-expo max-[1399px]:h-[440px] max-[1399px]:w-[82%] max-[1399px]:max-w-[420px] max-[1399px]:shrink-0 max-[1399px]:snap-center min-[1400px]:h-full min-[1400px]:basis-0 ${
                isActive ? 'min-[1400px]:flex-[452_1_0%]' : 'min-[1400px]:flex-[141_1_0%]'
              } ${index === 0 ? 'min-[1400px]:mr-[3px]' : ''}`}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-current={isActive ? 'step' : undefined}
                className="absolute inset-0 block h-full w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
              >
                {/* Phones/tablets get a full-photo crop; the desktop strip uses the design's narrow slices. */}
                <Image
                  src={`/images/home/v2/journey-m-${index + 1}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 90vw, 100vw"
                  className="object-cover min-[1400px]:hidden"
                />
                <Image
                  src={`/images/home/v2/journey-${index + 1}.webp`}
                  alt=""
                  fill
                  sizes={isActive ? '452px' : '141px'}
                  className="hidden object-cover min-[1400px]:block"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-b from-transparent from-[8.631%] to-[#030303]"
                  aria-hidden="true"
                />

                {/* "+" affordance on a collapsed strip (the design draws it on the 2nd card). */}
                {!isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute right-2 top-2 hidden size-11 items-center justify-center rounded-full bg-black/20 text-white transition-opacity duration-standard min-[1400px]:flex ${
                      index === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path
                        d="M13 6v14M6 13h14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}

                {/* Active / mobile copy */}
                <span
                  className={`absolute inset-x-3 bottom-3 flex flex-col gap-1.5 rounded-[20px] bg-black/70 p-4 text-white backdrop-blur-sm min-[1400px]:inset-x-auto min-[1400px]:bottom-[36px] min-[1400px]:left-4 min-[1400px]:right-4 min-[1400px]:rounded-none min-[1400px]:bg-transparent min-[1400px]:p-0 min-[1400px]:backdrop-blur-none ${
                    isActive ? 'min-[1400px]:opacity-100' : 'min-[1400px]:opacity-0'
                  } transition-opacity duration-300`}
                >
                  <span className="stretch-90 text-[20px] font-normal leading-7 min-[1400px]:text-[24px] min-[1400px]:leading-9">
                    {index + 1}. {step.title}
                  </span>
                  <span className="text-[16px] font-normal leading-6 min-[1400px]:max-w-[388px] min-[1400px]:text-[14px] min-[1400px]:leading-5">
                    {step.text}
                  </span>
                </span>

                {/* Collapsed strip label (desktop only) */}
                <span
                  className={`absolute bottom-[36px] left-2 right-[9px] hidden text-[16px] font-medium leading-5 text-white transition-opacity duration-300 min-[1400px]:block ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Position in the swipeable row (below 1400px). */}
      <div aria-hidden="true" className="flex justify-center gap-2 min-[1400px]:hidden">
        {steps.map((step, index) => (
          <span
            key={step.title}
            className={`h-2 rounded-full transition-all duration-standard ${index === page ? 'w-6 bg-ink' : 'w-2 bg-neutral-500'}`}
          />
        ))}
      </div>
    </div>
  );
}
