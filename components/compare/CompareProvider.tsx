'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Selection state for `CompareTool`. Kept in one provider (not per-page) because
 * a user can tick "⚖ Համեմատել" on a China list card and open the comparison
 * from a car-detail page — the selection has to survive that navigation within
 * the session.
 */

export const COMPARE_LIMIT = 3;

interface CompareContextValue {
  slugs: string[];
  isSelected: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** False once the 3-car limit is reached — cards disable their toggle. */
  canAdd: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error('useCompare must be used inside <CompareProvider>');
  return value;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const toggle = useCallback((slug: string) => {
    setSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= COMPARE_LIMIT) return current;
      return [...current, slug];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setSlugs((current) => current.filter((item) => item !== slug));
  }, []);

  const clear = useCallback(() => {
    setSlugs([]);
    setOpen(false);
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      slugs,
      isSelected: (slug) => slugs.includes(slug),
      toggle,
      remove,
      clear,
      canAdd: slugs.length < COMPARE_LIMIT,
      open,
      setOpen,
    }),
    [slugs, toggle, remove, clear, open],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
