'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CarOrigin, CarCondition } from '@/lib/types/car';

/**
 * "Compare cars" (Figma node `378:7857`, file `9Lq4XpWusTJj1VnM6laAZr`) — the
 * `⚖ Համեմատել` toggle on `CarCard` and the `Համեմատիր այս մեքենան` CTA on
 * `CarDetailHero` both feed the same list here, same shape
 * `LeadWidgetProvider` uses for its popups: one context, mounted once in
 * `app/layout.tsx`, everything else calls `useCompare()`.
 *
 * Capped at 2 — the actual Figma results frame (`378:7909`) only ever shows
 * two cars side by side, not the 2-3 `references/components.md`'s
 * `CompareTool` entry loosely allows for. Adding a 3rd evicts the oldest
 * (`cars[0]`) rather than refusing the action, so the toggle never needs a
 * disabled state to explain.
 *
 * Persisted to `localStorage` — this is the first client state in this app
 * that needs to survive a reload/new tab (everything else, e.g. lead-popup
 * state, is fine starting fresh). Hydrated in an effect, not a lazy
 * `useState` initializer: reading `localStorage` during the initializer would
 * run on the client's first render too and could disagree with the
 * server-rendered (always-empty) markup, the same hydration-mismatch trap
 * `UsaStateClocks`'s own `now` state avoids by starting `null` and filling in
 * after mount.
 */

export interface CompareCarRef {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  imageUrl?: string;
  origin: CarOrigin;
  condition: CarCondition;
}

interface CompareContextValue {
  cars: CompareCarRef[];
  isSelected: (id: string) => boolean;
  toggle: (car: CompareCarRef) => void;
  remove: (id: string) => void;
  isPickerOpen: boolean;
  openPicker: (seed?: CompareCarRef) => void;
  closePicker: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within <CompareProvider>');
  return ctx;
}

const STORAGE_KEY = 'autoroom:compare';
const MAX_CARS = 2;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<CompareCarRef[]>([]);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    // Deferred a tick so this isn't a synchronous setState-in-effect — same
    // pattern `UsaStateClocks`'s own first tick uses.
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setCars(JSON.parse(raw) as CompareCarRef[]);
      } catch {
        // Corrupt/blocked storage — start empty rather than break the page.
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    } catch {
      // Private window / storage full — the list just won't survive a reload.
    }
  }, [cars]);

  const isSelected = useCallback((id: string) => cars.some((car) => car.id === id), [cars]);

  const toggle = useCallback((car: CompareCarRef) => {
    setCars((current) => {
      if (current.some((entry) => entry.id === car.id)) {
        return current.filter((entry) => entry.id !== car.id);
      }
      const next = [...current, car];
      return next.length > MAX_CARS ? next.slice(next.length - MAX_CARS) : next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCars((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const openPicker = useCallback((seed?: CompareCarRef) => {
    if (seed) {
      setCars((current) => {
        if (current.some((entry) => entry.id === seed.id)) return current;
        const next = [...current, seed];
        return next.length > MAX_CARS ? next.slice(next.length - MAX_CARS) : next;
      });
    }
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const value = useMemo<CompareContextValue>(
    () => ({ cars, isSelected, toggle, remove, isPickerOpen, openPicker, closePicker }),
    [cars, isSelected, toggle, remove, isPickerOpen, openPicker, closePicker],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
