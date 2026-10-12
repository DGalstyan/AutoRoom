'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

export const DIALOG_HEADER = 'shrink-0 px-6 pb-4 pr-16 pt-6 sm:px-8 sm:pr-20 sm:pt-8';
export const DIALOG_BODY = 'min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8';
export const DIALOG_FOOTER =
  'flex shrink-0 items-center justify-end gap-3 border-t border-line-light bg-white px-6 py-4 sm:px-8';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  closeLabel: string;
  className?: string;
  /**
   * Replaces the default panel width, corner radius and padding (`max-w-lg rounded-lg p-6 sm:p-8`) for a
   * popup drawn to different measurements. Layout-only: keep the colours and overflow behaviour here.
   */
  panelClassName?: string;
  /** Where the X sits; defaults to 16px in from the top-right corner of its 44px tap box. */
  closeButtonClassName?: string;
  /** false: clicking the dark overlay does nothing (Esc and the X still close) — for forms a stray click would wipe. */
  closeOnOverlay?: boolean;
  /**
   * Fixed header/footer layout: no panel padding, no panel scroll — the caller renders
   * a `DIALOG_HEADER`, a scrolling `DIALOG_BODY` and a `DIALOG_FOOTER`.
   */
  fixedLayout?: boolean;
}

/**
 * Headless modal shell: focus-trapped, `aria-modal`, Esc closes, dark
 * overlay, body-scroll lock, restores focus to the trigger on close, X
 * top-right. `UniversalPopup` and `QuizPopup` compose their content inside.
 */
export function Dialog({
  open,
  onClose,
  titleId,
  children,
  closeLabel,
  className = '',
  panelClassName,
  closeButtonClassName = 'right-4 top-4',
  closeOnOverlay = true,
  fixedLayout = false,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {closeOnOverlay ? (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
          tabIndex={-1}
        />
      ) : (
        <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full bg-white shadow-card outline-none ${
          panelClassName ?? 'max-w-lg rounded-lg'
        } ${
          fixedLayout
            ? 'flex flex-col overflow-hidden'
            : `overflow-y-auto ${panelClassName ? '' : 'p-6 sm:p-8'}`
        } ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={`absolute ${closeButtonClassName} z-10 flex h-11 w-11 items-center justify-center rounded-pill text-ink/60 transition-colors hover:bg-surface-light hover:text-ink`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M1 1L17 17M17 1L1 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
