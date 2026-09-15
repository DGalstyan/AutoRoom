'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { PartnerBookingPopup } from '@/components/partners/PartnerBookingPopup';
import type { Branch } from '@/lib/branches';

interface BookingPopupContextValue {
  open: (sourceCta: string) => void;
}

const BookingPopupContext = createContext<BookingPopupContextValue | null>(null);

/**
 * Page-scoped equivalent of `LeadWidgetProvider` for `/partners`'
 * meeting-booking popup (`references/pages.md` "5. Partners" S5) — kept
 * separate from the site-wide provider since this popup only ever opens
 * from this one page, not from CTAs scattered across the whole site the
 * way the Universal/USA-auction popups are.
 */
export function useBookingPopup(): BookingPopupContextValue {
  const ctx = useContext(BookingPopupContext);
  if (!ctx) throw new Error('useBookingPopup must be used within <PartnersBookingProvider>');
  return ctx;
}

export function PartnersBookingProvider({
  children,
  branches,
}: {
  children: ReactNode;
  /** Fetched server-side (`getBranches()`) by `app/partners/page.tsx` and
   * threaded through here — see `PartnerBookingPopup`'s own doc comment for
   * why this Client Component can't fetch it itself. */
  branches: Branch[];
}) {
  const [state, setState] = useState<{ open: boolean; sourceCta: string }>({
    open: false,
    sourceCta: '',
  });

  const open = useCallback((sourceCta: string) => setState({ open: true, sourceCta }), []);
  const close = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <BookingPopupContext.Provider value={value}>
      {children}
      <PartnerBookingPopup
        open={state.open}
        onClose={close}
        sourceCta={state.sourceCta}
        branches={branches}
      />
    </BookingPopupContext.Provider>
  );
}
