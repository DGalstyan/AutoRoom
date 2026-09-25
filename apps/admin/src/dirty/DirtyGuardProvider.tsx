import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface DirtyEntry {
  dirty: boolean;
  save: () => Promise<boolean>;
}

interface DirtyGuardContextValue {
  register: (id: string, entry: DirtyEntry) => void;
  unregister: (id: string) => void;
  /**
   * Marks the *next* blocked navigation attempt as intentional (a redirect
   * that immediately follows a successful save) so the guard lets it through
   * without prompting.
   */
  bypass: () => void;
}

const DirtyGuardContext = createContext<DirtyGuardContextValue | null>(null);

/**
 * One in-app nav-away guard for the whole panel, fed by however many
 * independent dirty forms/sections happen to be mounted on the current page
 * (a Settings tab alone can have three, each saving its own key). The guard
 * lives here — once, wrapping every protected route's `<Outlet />` — rather
 * than one `useBlocker` per section, so exactly one dialog ever shows even
 * when several sections are dirty at once, and its Save button saves all of
 * them together.
 *
 * Requires a data router (`createBrowserRouter`/`RouterProvider`): `useBlocker`
 * has no equivalent under the declarative `<BrowserRouter>`.
 */
export function DirtyGuardProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, DirtyEntry>>(new Map());
  const bypassRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const register = useCallback((id: string, entry: DirtyEntry) => {
    setEntries((current) => new Map(current).set(id, entry));
  }, []);
  const unregister = useCallback((id: string) => {
    setEntries((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  const dirtyEntries = Array.from(entries.values()).filter((entry) => entry.dirty);
  const anyDirty = dirtyEntries.length > 0;

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return false;
      }
      return anyDirty && currentLocation.pathname !== nextLocation.pathname;
    },
    [anyDirty],
  );
  const blocker = useBlocker(shouldBlock);

  // Covers closing/refreshing the tab — in-app navigation is caught by the
  // blocker above instead, which can offer Save/Leave/Cancel; the browser's
  // own confirm can only ever be a generic yes/no, so it's reserved for the
  // one case where there is no in-app chance to choose.
  useEffect(() => {
    if (!anyDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty]);

  async function handleSaveAndLeave() {
    setSaving(true);
    try {
      const results = await Promise.all(dirtyEntries.map((entry) => entry.save()));
      if (results.every(Boolean)) blocker.proceed?.();
    } finally {
      setSaving(false);
    }
  }

  const bypass = useCallback(() => {
    bypassRef.current = true;
  }, []);

  const value = useMemo(() => ({ register, unregister, bypass }), [register, unregister, bypass]);

  return (
    <DirtyGuardContext.Provider value={value}>
      {children}
      {blocker.state === 'blocked' && (
        <Dialog open maxWidth="xs" fullWidth onClose={saving ? undefined : () => blocker.reset?.()}>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.9375rem' }}>
              This page has unsaved changes. Save them before leaving, or leave without saving?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => blocker.reset?.()} disabled={saving} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => blocker.proceed?.()} disabled={saving} color="error">
              Leave without saving
            </Button>
            <Button onClick={handleSaveAndLeave} disabled={saving} variant="contained">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </DirtyGuardContext.Provider>
  );
}

/**
 * Contributes one dirty/save pair to the app-wide nav-away guard for as long
 * as the calling component stays mounted. `id` only needs to be unique
 * within the current page (e.g. the setting key, or the owning form's route).
 *
 * See `useDirtyGuardBypass` for the escape hatch a form needs if it ever
 * `navigate()`s itself right after a successful save.
 */
export function useDirtyGuard(id: string, dirty: boolean, save: () => Promise<boolean>) {
  const ctx = useContext(DirtyGuardContext);
  if (!ctx) throw new Error('useDirtyGuard must be used within DirtyGuardProvider');
  const { register, unregister } = ctx;

  useEffect(() => {
    register(id, { dirty, save });
    return () => unregister(id);
  }, [id, dirty, save, register, unregister]);
}

/**
 * Escape hatch for a `navigate()` call that intentionally follows a
 * successful save (e.g. redirecting from "new car" to the created car's edit
 * page) — call right before that `navigate()` so the guard doesn't block its
 * own post-save redirect.
 */
export function useDirtyGuardBypass() {
  const ctx = useContext(DirtyGuardContext);
  if (!ctx) throw new Error('useDirtyGuardBypass must be used within DirtyGuardProvider');
  return ctx.bypass;
}
