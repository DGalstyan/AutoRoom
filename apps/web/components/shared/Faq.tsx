'use client';

import { useId, useState } from 'react';
import type { FaqItem } from '@/lib/data/faq';
import { messages } from '@/lib/messages';

const t = messages.common.faq;

export interface FaqProps {
  items: readonly FaqItem[];
  heading?: string;
}

/** Accordion — each row is a real button with `aria-expanded`. */
export function Faq({ items, heading = t.heading }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div>
      <h2 className="font-display text-h2 font-bold text-ink">{heading}</h2>
      <dl className="mt-6 divide-y divide-line-light border-t border-line-light">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `${baseId}-q-${index}`;
          const panelId = `${baseId}-a-${index}`;
          return (
            <div key={buttonId}>
              <dt>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left font-display text-lead font-semibold text-ink"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-h3 font-light text-accent transition-transform duration-standard ease-expo ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
              </dt>
              <dd
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="whitespace-pre-line pb-6 text-body text-ink/75"
              >
                {item.a}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
