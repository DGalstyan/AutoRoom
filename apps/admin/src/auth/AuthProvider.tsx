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
import { ApiError, makeClient } from '@/lib/api';

/**
 * Session state for the whole admin.
 *
 * The access token is held in React state and nowhere else — not localStorage,
 * not a readable cookie. Anything a script can read, an XSS can exfiltrate; the
 * long-lived credential stays in the httpOnly refresh cookie the browser will
 * not hand to JavaScript, and a page reload recovers the session by spending it
 * on `/auth/refresh`.
 */

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  identity: Identity | null;
  /** Client carrying the current bearer token. */
  api: ReturnType<typeof makeClient>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** Refresh this many seconds before the access token actually expires. */
const REFRESH_MARGIN_SECONDS = 60;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const refreshTimer = useRef<number | null>(null);

  const api = useMemo(() => makeClient(token), [token]);

  const clearTimer = useCallback(() => {
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  /**
   * Spend the refresh cookie for a new access token, then schedule the next
   * rotation. Returns the token so the caller can chain an identity load.
   */
  const rotate = useCallback(async (): Promise<string | null> => {
    const anonymous = makeClient();
    try {
      const session = await anonymous.auth.refresh();
      setToken(session.accessToken);

      clearTimer();
      const delay = Math.max(5, session.expiresIn - REFRESH_MARGIN_SECONDS) * 1000;
      refreshTimer.current = window.setTimeout(() => void rotate(), delay);

      return session.accessToken;
    } catch {
      // No cookie, expired, or revoked — all mean "not signed in".
      clearTimer();
      setToken(null);
      setIdentity(null);
      setStatus('anonymous');
      return null;
    }
  }, [clearTimer]);

  const loadIdentity = useCallback(async (accessToken: string) => {
    const client = makeClient(accessToken);
    const me = await client.auth.me();
    setIdentity(me);
    setStatus('authenticated');
  }, []);

  // On boot, try to resume a session from the refresh cookie.
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
      // A already-invalid session still ends locally; anything else is worth knowing.
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
