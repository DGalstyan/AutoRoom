import { useEffect, useSyncExternalStore } from 'react';

/** Full-page light overlays (the booking popup) ask the site header to draw its white pill while they are open. */
let lightOverlays = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useHeaderForcedLight(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => lightOverlays > 0,
    () => false,
  );
}

/** While `active`, the header renders light (white pill, dark text). */
export function useForceLightHeader(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lightOverlays += 1;
    emit();
    return () => {
      lightOverlays -= 1;
      emit();
    };
  }, [active]);
}

/** Full-page overlays also ask floating bars (the compare bar) to step aside while they are open. */
let barHiders = 0;

export function useFloatingBarsHidden(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => barHiders > 0,
    () => false,
  );
}

export function useHideFloatingBars(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    barHiders += 1;
    emit();
    return () => {
      barHiders -= 1;
      emit();
    };
  }, [active]);
}
