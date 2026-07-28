'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** FAQ rows behave as a single-open accordion; spec tables allow multiple. */
  mode?: 'single' | 'multiple';
  defaultOpenIds?: string[];
  className?: string;
}

/**
 * Accordion behind the `Faq` component and the PriceJourney "detailed breakdown"
 * table. Each row is a button with `aria-expanded` + `aria-controls`.
 */
export function Accordion({
  items,
  mode = 'single',
  defaultOpenIds = [],
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  function toggle(id: string) {
    setOpenIds((current) => {
      const isOpen = current.includes(id);
      if (mode === 'single') return isOpen ? [] : [id];
      return isOpen ? current.filter((openId) => openId !== id) : [...current, id];
    });
  }

  return (
    <div className={cn('divide-y divide-line-light border-y border-line-light', className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={`${baseId}-trigger-${item.id}`}
                aria-expanded={open}
                aria-controls={`${baseId}-panel-${item.id}`}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-lead font-semibold transition-colors duration-micro hover:text-accent"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative flex h-8 w-8 flex-none items-center justify-center rounded-pill border border-line-light transition-transform duration-standard ease-expo',
                    open && 'rotate-45 border-accent text-accent',
                  )}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4">
                    <path
                      d="M10 4v12M4 10h12"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              id={`${baseId}-panel-${item.id}`}
              role="region"
              aria-labelledby={`${baseId}-trigger-${item.id}`}
              hidden={!open}
              className="pb-6 pr-12 text-body text-muted"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
