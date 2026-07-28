'use client';

import { useId, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown next to the label (e.g. China list tabs). */
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name of the tablist, e.g. the section heading. */
  label: string;
  /**
   * Shared id prefix. Pass the same value to `TabPanel` so `aria-controls` and
   * `aria-labelledby` line up — see `useTabsId()`.
   */
  baseId?: string;
  variant?: 'pill' | 'underline';
  className?: string;
}

/** Generates the id prefix shared by a `Tabs` + its `TabPanel`s. */
export function useTabsId() {
  return useId();
}

/**
 * ARIA tabs with roving focus and arrow-key navigation. Used by the China list
 * (Առկա / Պատվերով), car-detail image tabs (Exterior/Interior/Details/Video)
 * and the Offers page (Ընթացիկ | Անցած).
 */
export function Tabs({
  items,
  value,
  onChange,
  label,
  baseId,
  variant = 'pill',
  className,
}: TabsProps) {
  const generatedId = useId();
  const idPrefix = baseId ?? generatedId;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === value);
    if (index < 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = items[nextIndex];
    onChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'flex flex-wrap items-center gap-2',
        variant === 'underline' && 'gap-6 border-b border-line-light',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'font-medium transition-colors duration-micro ease-expo',
              variant === 'pill'
                ? cn(
                    'rounded-pill border px-5 py-2 text-small',
                    selected
                      ? 'border-accent bg-accent text-paper'
                      : 'border-line-light bg-paper text-ink hover:border-ink',
                  )
                : cn(
                    '-mb-px border-b-2 px-1 pb-3 text-body',
                    selected
                      ? 'border-accent text-ink'
                      : 'border-transparent text-muted hover:text-ink',
                  ),
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className={cn('ml-2 text-caption', selected ? 'opacity-80' : 'text-muted')}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Panel that pairs with `Tabs`; mount one per tab id. */
export function TabPanel({
  id,
  baseId,
  active,
  children,
}: {
  id: string;
  baseId: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
      hidden={!active}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
