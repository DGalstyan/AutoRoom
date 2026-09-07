'use client';

import { useId, useState } from 'react';
import type { FaqItem } from '@/lib/data/faq';
import { useMessages } from '@/components/shared/LocaleProvider';

export interface FaqProps {
  items: readonly FaqItem[];
  heading?: string;
  /** Figma's Homepage FAQ (node `110:503`) has no visible heading above the
   * accordion — pass `hideHeading` there and keep a real `h2` for the a11y
   * outline (and for pages that DO want the heading shown, e.g. a dedicated
   * FAQ/Contact section, this defaults to visible). */
  hideHeading?: boolean;
  /** Show only this many items until "Load more" is pressed, which reveals
   * the rest in place — no navigation, since it's the exact same admin-
   * managed list either way. Used by `ContactFaq` ("3-4 top FAQ" per the
   * spec) rather than sending someone to a different page for data that's
   * already sitting right here. Omit to always show every item (Homepage's
   * own FAQ). */
  initialCount?: number;
}

/** Accordion — each row is its own rounded card; a real button with `aria-expanded`. */
export function Faq({ items, heading, hideHeading = false, initialCount }: FaqProps) {
  const t = useMessages().common.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(initialCount == null);
  const baseId = useId();

  const visibleItems = expanded ? items : items.slice(0, initialCount);
  const hasMore = !expanded && items.length > visibleItems.length;

  return (
    <div>
      <h2 className={hideHeading ? 'sr-only' : 'font-display text-home-h2 font-light text-ink'}>
        {heading ?? t.heading}
      </h2>
      <div className={`mx-auto max-w-3xl space-y-4 ${hideHeading ? '' : 'mt-8'}`}>
        {visibleItems.map((item, index) => {
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
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-medium leading-[20px] text-ink sm:px-6"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-neutral-800 transition-transform duration-standard ease-expo ${
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
      {hasMore && (
        <p className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex min-h-11 items-center text-body font-medium text-accent hover:text-accent-600"
          >
            {t.loadMore}
          </button>
        </p>
      )}
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
