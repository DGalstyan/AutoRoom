'use client';

import { useId, useState } from 'react';
import type { FaqItem } from '@/lib/data/faq';
import { messages } from '@/lib/messages';

const t = messages.common.faq;

export interface FaqProps {
  items: readonly FaqItem[];
  heading?: string;
  /** Figma's Homepage FAQ (node `9321:6655`) has no visible heading above the
   * accordion — pass `hideHeading` there and keep a real `h2` for the a11y
   * outline (and for pages that DO want the heading shown, e.g. a dedicated
   * FAQ/Contact section, this defaults to visible). */
  hideHeading?: boolean;
}

/** Accordion — each row is its own rounded card; a real button with `aria-expanded`. */
export function Faq({ items, heading = t.heading, hideHeading = false }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div>
      <h2 className={hideHeading ? 'sr-only' : 'font-display text-home-h2 font-light text-ink'}>
        {heading}
      </h2>
      <div className={`mx-auto max-w-3xl space-y-3 ${hideHeading ? '' : 'mt-8'}`}>
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `${baseId}-q-${index}`;
          const panelId = `${baseId}-a-${index}`;
          return (
            <div key={buttonId} className="overflow-hidden rounded-xl bg-white shadow-card">
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left text-home-label font-normal text-ink sm:px-6"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-accent transition-transform duration-standard ease-expo ${
                      isOpen ? '-rotate-180' : ''
                    }`}
                  >
                    <ChevronDown />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="whitespace-pre-line px-5 pb-5 text-body text-neutral-800 sm:px-6"
              >
                {item.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
