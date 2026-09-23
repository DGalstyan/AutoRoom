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
import type { AuthContext as Identity } from '@autoroom/api/client';
import { ApiError, makeClient, withReauth } from '@/lib/portal/api';

/**
 * Session state for the partner portal (`/partners/portal`) — the public
 * site's own copy of `apps/admin/src/auth/AuthProvider.tsx`, kept in
 * lockstep with it rather than sharing code across the Vite/Next boundary.
 *
 * The access token lives in React state and nowhere else — not
 * localStorage, not a readable cookie. Anything a script can read, an XSS
 * can exfiltrate; the long-lived credential stays in the httpOnly refresh
 * cookie the browser will not hand to JavaScript, and a page load recovers
 * the session by spending it on `/auth/refresh`.
 */

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  identity: Identity | null;
  api: ReturnType<typeof makeClient>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const PortalAuthContext = createContext<AuthState | null>(null);

export function usePortalAuth() {
  const value = useContext(PortalAuthContext);
  if (!value) throw new Error('usePortalAuth must be used inside <PortalAuthProvider>');
  return value;
}

/** Refresh this many seconds before the access token actually expires. */
const REFRESH_MARGIN_SECONDS = 60;

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const refreshTimer = useRef<number | null>(null);
  const inFlightRefresh = useRef<Promise<string | null> | null>(null);

  const clearTimer = useCallback(() => {
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  // Holds the latest `rotate` so the scheduled timeout below can call it
  // without referencing the `useCallback` binding before it exists (or
  // capturing a stale closure across renders).
  const rotateRef = useRef<() => Promise<string | null>>(() => Promise.resolve(null));

  /**
   * Spend the refresh cookie for a new access token, then schedule the next
   * rotation. Concurrent callers share one request — see the admin
   * provider's own comment on why that dedup matters (StrictMode double
   * invocation, a scheduled rotation landing on top of a manual one).
   */
  const rotate = useCallback((): Promise<string | null> => {
    if (inFlightRefresh.current) return inFlightRefresh.current;

    const attempt = (async () => {
      const anonymous = makeClient();
      try {
        const session = await anonymous.auth.refresh();
        setToken(session.accessToken);

        clearTimer();
        const delay = Math.max(5, session.expiresIn - REFRESH_MARGIN_SECONDS) * 1000;
        refreshTimer.current = window.setTimeout(() => void rotateRef.current(), delay);

        return session.accessToken;
      } catch {
        clearTimer();
        setToken(null);
        setIdentity(null);
        setStatus('anonymous');
        return null;
      } finally {
        inFlightRefresh.current = null;
      }
    })();

    inFlightRefresh.current = attempt;
    return attempt;
  }, [clearTimer]);

  useEffect(() => {
    rotateRef.current = rotate;
  }, [rotate]);

  // `rotate` closes over `refreshTimer`/`inFlightRefresh`, but only reads
  // them inside its own async body, never synchronously during this render;
  // the compiler can't see that and flags the closure itself as a ref access.
  // eslint-disable-next-line react-hooks/refs
  const api = useMemo(() => withReauth(makeClient(token), rotate), [token, rotate]);

  const loadIdentity = useCallback(async (accessToken: string) => {
    const client = makeClient(accessToken);
    const me = await client.auth.me();
    setIdentity(me);
    setStatus('authenticated');
  }, []);

  // On mount, try to resume a session from the refresh cookie.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const accessToken = await rotate();
      if (cancelled || !accessToken) return;
      try {
        await loadIdentity(accessToken);
      } catch {
        setToken(null);
        setIdentity(null);
        setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [rotate, loadIdentity, clearTimer]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const anonymous = makeClient();
      const session = await anonymous.auth.login({ email, password });
      setToken(session.accessToken);

      clearTimer();
      const delay = Math.max(5, session.expiresIn - REFRESH_MARGIN_SECONDS) * 1000;
      refreshTimer.current = window.setTimeout(() => void rotate(), delay);

      await loadIdentity(session.accessToken);
    },
    [clearTimer, loadIdentity, rotate],
  );

  const signOut = useCallback(async () => {
    clearTimer();
    try {
      await makeClient(token).auth.logout();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
    setToken(null);
    setIdentity(null);
    setStatus('anonymous');
  }, [clearTimer, token]);

  const refreshIdentity = useCallback(async () => {
    if (token) await loadIdentity(token);
  }, [token, loadIdentity]);

  const value = useMemo<AuthState>(
    () => ({ status, identity, api, signIn, signOut, refreshIdentity }),
    [status, identity, api, signIn, signOut, refreshIdentity],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}
