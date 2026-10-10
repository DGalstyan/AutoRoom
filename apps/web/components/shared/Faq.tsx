'use client';

import { useId, useState } from 'react';
import type { FaqItem } from '@/lib/data/faq';
import Link from 'next/link';
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
  /** Adds a «Տես բոլոր հարցերը» link under the accordion (the `/faq` page, on this topic's anchor). */
  viewAllHref?: string;
}

/** Accordion — each row is its own rounded card; a real button with `aria-expanded`. */
export function Faq({ items, heading, hideHeading = false, initialCount, viewAllHref }: FaqProps) {
  const t = useMessages().common.faq;
  // The design (Figma 436:2012) shows the first question open.
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [expanded, setExpanded] = useState(initialCount == null);
  const baseId = useId();

  const visibleItems = expanded ? items : items.slice(0, initialCount);
  const hasMore = !expanded && items.length > visibleItems.length;

  return (
    <div>
      <h2 className={hideHeading ? 'sr-only' : 'font-display text-home-h2 font-light text-ink'}>
        {heading ?? t.heading}
      </h2>
      <div className={`mx-auto flex max-w-[760px] flex-col gap-4 ${hideHeading ? '' : 'mt-8'}`}>
        {visibleItems.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `${baseId}-q-${index}`;
          const panelId = `${baseId}-a-${index}`;
          return (
            <div
              key={buttonId}
              className={`overflow-hidden bg-white transition-[border-radius] duration-500 ease-expo ${
                isOpen ? 'rounded-[32px]' : 'rounded-[236px]'
              }`}
            >
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={`flex w-full justify-between gap-4 px-6 text-left text-[16px] font-medium leading-[20px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent ${
                    isOpen ? 'items-start pb-0 pt-7' : 'min-h-[76px] items-center py-3'
                  }`}
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-neutral-800 transition-transform duration-standard ease-expo ${
                      isOpen ? '-rotate-180' : ''
                    } ${isOpen ? 'mt-0.5' : ''}`}
                  >
                    <ChevronDown />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                // `inert` keeps a collapsed answer out of the tab order / a11y tree. Set through a
                // ref because React 18 doesn't pass the boolean prop through.
                ref={(node) => {
                  if (!node) return;
                  if (isOpen) node.removeAttribute('inert');
                  else node.setAttribute('inert', '');
                }}
                className={`grid transition-[grid-template-rows] duration-500 ease-expo ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="mt-4 whitespace-pre-line px-6 pb-6 text-[16px] leading-6 text-neutral-800">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {viewAllHref && (
        <p className="mt-6 text-center">
          <Link
            href={viewAllHref}
            className="inline-flex min-h-11 items-center text-body font-medium text-accent hover:text-accent-600"
          >
            {t.viewAll}
          </Link>
        </p>
      )}
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
