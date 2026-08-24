'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  closeLabel: string;
  className?: string;
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
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-card outline-none sm:p-8 ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill text-ink/60 transition-colors hover:bg-surface-light hover:text-ink"
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
