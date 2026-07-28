'use client';

import { useCallback, useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * `false` during SSR and the hydrating render, `true` afterwards — the portal
 * needs a real `document.body`. Written as an external store (a subscription
 * that never fires) rather than `useState` + `useEffect`, which would be a
 * setState inside an effect.
 */
const NEVER_CHANGES = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visual title but keep it for screen readers. */
  hideTitle?: boolean;
  description?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

const sizes = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Dialog shell for every popup on the site (Universal, Quiz, per-car, partner
 * booking). Contract from the skill's accessibility rules: focus-trapped,
 * Esc closes, focus is restored to the trigger, `aria-modal`, dark overlay,
 * X in the top-right.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = 'lg',
  className,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const mounted = useIsHydrated();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Lock scroll without a layout jump when the scrollbar disappears.
    const { body } = document;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener('keydown', handleKeyDown, true);

    // Focus the first field, falling back to the panel itself.
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-bg/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 max-h-[92vh] w-full animate-dialog-in overflow-y-auto rounded-t-lg bg-paper',
          'p-6 shadow-dialog outline-none sm:rounded-lg sm:p-8',
          sizes[size],
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.a11y.close')}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill text-muted transition-colors duration-micro hover:bg-surface-light hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 id={titleId} className={cn('pr-10 text-h3', hideTitle && 'sr-only')}>
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-2 text-small text-muted">
            {description}
          </p>
        ) : null}

        <div className={cn(!hideTitle && 'mt-6')}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
