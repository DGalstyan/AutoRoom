'use client';

import { useSyncExternalStore } from 'react';

/** True once the page has scrolled past `threshold` — drives Header's condensed state. */
export function useScrolled(threshold = 8): boolean {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('scroll', callback, { passive: true });
      return () => window.removeEventListener('scroll', callback);
    },
    () => (typeof window === 'undefined' ? false : window.scrollY > threshold),
    () => false,
  );
}
