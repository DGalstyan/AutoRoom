'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UniversalPopup } from '@/components/shared/UniversalPopup';
import { QuizPopup } from '@/components/shared/QuizPopup';
import { t } from '@/lib/i18n';
import type { LeadBudget, LeadCarContext, LeadInterest, QuizContext } from '@/lib/lead';
import type { CarColorId } from '@/types/car';

/**
 * Single entry point for the two lead widgets. Pages never render popups
 * themselves — they call `openUniversal()` / `openQuiz()` so the hidden lead
 * context (source page, source CTA) is attached in one place.
 *
 * Widget rule (getting this wrong is the classic mistake):
 *   Quiz  → global StickyCta + Homepage Section 10 ONLY.
 *   Universal → every other "Ստանալ առաջարկ" CTA.
 */

export interface OpenUniversalOptions {
  /** The CTA label that opened the popup — stored on the lead. */
  sourceCta: string;
  preselect?: Partial<{ interest: LeadInterest; budget: LeadBudget }>;
  /** Locks a read-only car card at the top of the popup (per-car variant). */
  car?: LeadCarContext;
  /** Colour choice offered alongside the locked card, order-only cars only. */
  colorOptions?: CarColorId[];
}

export interface OpenQuizOptions {
  sourceCta: string;
}

interface LeadWidgetState {
  widget: 'universal' | 'quiz' | null;
  sourcePage: string;
  sourceCta: string;
  preselect?: OpenUniversalOptions['preselect'];
  car?: LeadCarContext;
  colorOptions?: CarColorId[];
  quiz?: QuizContext;
  /**
   * Increments on every open (and on the quiz handoff). Used as the popups'
   * `key`, so each one mounts fresh with the new context instead of carrying a
   * previous lead's half-filled fields.
   */
  session: number;
}

interface LeadWidgetContextValue {
  openUniversal: (options: OpenUniversalOptions) => void;
  openQuiz: (options: OpenQuizOptions) => void;
  close: () => void;
  /** True while any popup is open — StickyCta hides itself on this. */
  isOpen: boolean;
}

const LeadWidgetContext = createContext<LeadWidgetContextValue | null>(null);

export function useLeadWidget() {
  const value = useContext(LeadWidgetContext);
  if (!value) throw new Error('useLeadWidget must be used inside <LeadWidgetProvider>');
  return value;
}

const CLOSED: LeadWidgetState = { widget: null, sourcePage: '/', sourceCta: '', session: 0 };

export function LeadWidgetProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<LeadWidgetState>(CLOSED);

  const close = useCallback(() => setState((current) => ({ ...current, widget: null })), []);

  const openUniversal = useCallback(
    ({ sourceCta, preselect, car, colorOptions }: OpenUniversalOptions) =>
      setState((current) => ({
        widget: 'universal',
        sourcePage: pathname,
        sourceCta,
        preselect,
        car,
        colorOptions,
        session: current.session + 1,
      })),
    [pathname],
  );

  const openQuiz = useCallback(
    ({ sourceCta }: OpenQuizOptions) =>
      setState((current) => ({
        widget: 'quiz',
        sourcePage: pathname,
        sourceCta,
        session: current.session + 1,
      })),
    [pathname],
  );

  /**
   * Quiz → Universal handoff. The quiz never submits; it swaps itself for the
   * Universal Popup carrying the answers and the 3 recommended cars, so the
   * lead still arrives through the one submission path.
   */
  const completeQuiz = useCallback(
    (quiz: QuizContext, preselect: OpenUniversalOptions['preselect']) =>
      setState((current) => ({
        ...current,
        widget: 'universal',
        sourceCta: t('quiz.resultCta'),
        preselect,
        quiz,
        session: current.session + 1,
      })),
    [],
  );

  const value = useMemo<LeadWidgetContextValue>(
    () => ({ openUniversal, openQuiz, close, isOpen: state.widget !== null }),
    [openUniversal, openQuiz, close, state.widget],
  );

  return (
    <LeadWidgetContext.Provider value={value}>
      {children}

      <QuizPopup
        key={`quiz-${state.session}`}
        open={state.widget === 'quiz'}
        onClose={close}
        onComplete={completeQuiz}
      />

      <UniversalPopup
        key={`universal-${state.session}`}
        open={state.widget === 'universal'}
        onClose={close}
        sourcePage={state.sourcePage}
        sourceCta={state.sourceCta}
        preselect={state.preselect}
        car={state.car}
        colorOptions={state.colorOptions}
        quiz={state.quiz}
      />
    </LeadWidgetContext.Provider>
  );
}
