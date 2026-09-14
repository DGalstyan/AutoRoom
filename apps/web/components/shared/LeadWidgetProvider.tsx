'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { UniversalPopup, type UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import { QuizPopup } from '@/components/shared/QuizPopup';
import { UsaAuctionContactPopup } from '@/components/usa/UsaAuctionContactPopup';
import type { LeadBudget, LeadInterest } from '@/lib/leads';

interface OpenUniversalOptions {
  sourceCta: string;
  preselect?: Partial<{ interest: LeadInterest; budget: LeadBudget }>;
  car?: UniversalPopupCarContext;
  comment?: string;
  quizAnswers?: Record<string, string>;
}

interface OpenQuizOptions {
  sourceCta: string;
}

interface OpenUsaAuctionOptions {
  sourceCta: string;
}

interface LeadWidgetContextValue {
  openUniversal: (opts: OpenUniversalOptions) => void;
  openQuiz: (opts: OpenQuizOptions) => void;
  openUsaAuctionPopup: (opts: OpenUsaAuctionOptions) => void;
  isAnyOpen: boolean;
}

const LeadWidgetContext = createContext<LeadWidgetContextValue | null>(null);

/**
 * The single place pages/components reach for a lead popup. Never render
 * `UniversalPopup`/`QuizPopup` directly elsewhere — call `openUniversal` /
 * `openQuiz` here, which attaches `sourcePage` automatically from the route.
 */
export function useLeadWidgets(): LeadWidgetContextValue {
  const ctx = useContext(LeadWidgetContext);
  if (!ctx) throw new Error('useLeadWidgets must be used within <LeadWidgetProvider>');
  return ctx;
}

const INITIAL_UNIVERSAL = { open: false, sourceCta: '' } satisfies {
  open: boolean;
} & OpenUniversalOptions;

export function LeadWidgetProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [universal, setUniversal] = useState<{ open: boolean } & OpenUniversalOptions>(
    INITIAL_UNIVERSAL,
  );
  const [quiz, setQuiz] = useState<{ open: boolean; sourceCta: string }>({
    open: false,
    sourceCta: '',
  });
  const [usaAuction, setUsaAuction] = useState<{ open: boolean; sourceCta: string }>({
    open: false,
    sourceCta: '',
  });

  const openUniversal = useCallback((opts: OpenUniversalOptions) => {
    setQuiz((prev) => ({ ...prev, open: false }));
    setUsaAuction((prev) => ({ ...prev, open: false }));
    setUniversal({ open: true, ...opts });
  }, []);

  const openQuiz = useCallback((opts: OpenQuizOptions) => {
    setUniversal((prev) => ({ ...prev, open: false }));
    setUsaAuction((prev) => ({ ...prev, open: false }));
    setQuiz({ open: true, sourceCta: opts.sourceCta });
  }, []);

  const openUsaAuctionPopup = useCallback((opts: OpenUsaAuctionOptions) => {
    setUniversal((prev) => ({ ...prev, open: false }));
    setQuiz((prev) => ({ ...prev, open: false }));
    setUsaAuction({ open: true, sourceCta: opts.sourceCta });
  }, []);

  const closeUniversal = useCallback(() => setUniversal((prev) => ({ ...prev, open: false })), []);
  const closeQuiz = useCallback(() => setQuiz((prev) => ({ ...prev, open: false })), []);
  const closeUsaAuction = useCallback(
    () => setUsaAuction((prev) => ({ ...prev, open: false })),
    [],
  );

  const isAnyOpen = universal.open || quiz.open || usaAuction.open;

  const value = useMemo(
    () => ({ openUniversal, openQuiz, openUsaAuctionPopup, isAnyOpen }),
    [openUniversal, openQuiz, openUsaAuctionPopup, isAnyOpen],
  );

  return (
    <LeadWidgetContext.Provider value={value}>
      <div inert={isAnyOpen}>{children}</div>
      <UniversalPopup
        open={universal.open}
        onClose={closeUniversal}
        preselect={universal.preselect}
        car={universal.car}
        prefilledComment={universal.comment}
        quizAnswers={universal.quizAnswers}
        sourcePage={pathname}
        sourceCta={universal.sourceCta}
      />
      <QuizPopup
        open={quiz.open}
        onClose={closeQuiz}
        sourcePage={pathname}
        sourceCta={quiz.sourceCta}
        onOpenUniversal={openUniversal}
      />
      <UsaAuctionContactPopup
        open={usaAuction.open}
        onClose={closeUsaAuction}
        sourcePage={pathname}
        sourceCta={usaAuction.sourceCta}
      />
    </LeadWidgetContext.Provider>
  );
}
