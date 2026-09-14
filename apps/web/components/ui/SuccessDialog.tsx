'use client';

import { useEffect, useId, useRef } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

export interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  /** Bold heading, e.g. `t.successHeading`. */
  heading: string;
  /** Regular-weight body line, e.g. the interpolated `t.successTemplate`. */
  body: string;
  /** Optional smaller/muted third line — a formatted date/time/branch string. */
  detail?: string;
  /** aria-label for the top-right X — every caller already has a `close`-shaped string. */
  closeLabel: string;
}

/**
 * Shared success-confirmation modal — Figma node `285:41` ("success message",
 * file `9Lq4XpWusTJj1VnM6laAZr`): a compact card (NOT `Dialog.tsx`'s `max-w-lg`
 * shell), `rounded-[30px]`, `36px` padding, ~`356px` wide, a 100×100
 * checkmark-in-circle icon, then heading/body/optional detail, all centered.
 * No footer button — only the top-right X (+ overlay click, + Esc) dismisses,
 * a deliberate simplification versus the old per-form "Close" buttons this
 * replaces.
 *
 * Reuses `Dialog.tsx`'s exact overlay/focus-trap/body-scroll-lock/X-icon
 * pattern via `useFocusTrap` directly (rather than nesting inside `Dialog`
 * itself, since the card markup/size are entirely different) so every modal
 * on the site — regular or success — behaves identically for a11y purposes.
 * Carries the `role="status" aria-live="polite"` announcement internally so
 * callers don't each have to remember it.
 */
export function SuccessDialog({
  open,
  onClose,
  heading,
  body,
  detail,
  closeLabel,
}: SuccessDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) headingRef.current?.focus();
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
        className="relative z-10 flex w-full max-w-[356px] flex-col items-center gap-4 rounded-[30px] bg-white p-9 text-center shadow-card outline-none"
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

        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
          <CheckCircleGlyph />
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-h3 font-bold text-ink outline-none"
          >
            {heading}
          </h2>
          <p className="text-body text-ink/80">{body}</p>
          {detail && <p className="text-small text-muted">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

/** 100×100 checkmark-in-circle — `bg-success-light` fill, `neutral-800` stroke. */
function CheckCircleGlyph() {
  return (
    <span
      className="flex size-[100px] shrink-0 items-center justify-center rounded-pill bg-success-light"
      aria-hidden="true"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path
          d="M10 21 17 28 30 13"
          stroke="currentColor"
          className="text-neutral-800"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
