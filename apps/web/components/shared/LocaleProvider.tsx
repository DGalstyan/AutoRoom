'use client';

import { createContext, useContext, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, Messages } from '@/lib/i18n';
import { setLocaleAction } from '@/lib/i18n-actions';

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  /** Which locales the switcher should offer — the admin-managed subset, not necessarily all of `SUPPORTED_LOCALES`. */
  enabledLocales: Locale[];
  setLocale: (locale: Locale) => void;
  /** True while a locale switch's cookie write + refresh is in flight. */
  isPending: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * The client-side half of `lib/i18n.ts`: the root layout resolves the
 * locale + message tree server-side and hands them down here once, so every
 * client component below — `Header`, popups, `ChinaFilters`, and everything
 * else that previously did a module-level `const t = messages.xxx` — reads
 * them per-render via `useMessages()`/`useLocale()` instead of a constant
 * frozen at import time (which would serve every visitor whichever locale
 * happened to load the module first).
 */
export function LocaleProvider({
  locale,
  messages,
  enabledLocales,
  children,
}: {
  locale: Locale;
  messages: Messages;
  enabledLocales: Locale[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <LocaleContext.Provider value={{ locale, messages, enabledLocales, setLocale, isPending }}>
      {children}
    </LocaleContext.Provider>
  );
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocaleContext must be used within <LocaleProvider>');
  return ctx;
}

/** The active locale's full message tree — the client-component equivalent of `getServerMessages()`. */
export function useMessages(): Messages {
  return useLocaleContext().messages;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useSetLocale(): { setLocale: (locale: Locale) => void; isPending: boolean } {
  const { setLocale, isPending } = useLocaleContext();
  return { setLocale, isPending };
}

export function useEnabledLocales(): Locale[] {
  return useLocaleContext().enabledLocales;
}
