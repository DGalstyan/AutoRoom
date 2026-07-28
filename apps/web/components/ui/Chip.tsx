'use client';

import { cn } from '@/lib/utils';

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  selected?: boolean;
  /** 'single' renders radio semantics, 'multiple' renders toggle semantics. */
  selectionMode?: 'single' | 'multiple';
  children: React.ReactNode;
}

/**
 * Selectable pill. The chip is the core input of the whole lead funnel — the
 * Universal Popup Step 2, the Quiz's 5 questions and the China filters are all
 * chips, because the spec minimises typing.
 */
export function Chip({
  selected = false,
  selectionMode = 'single',
  className,
  children,
  ...props
}: ChipProps) {
  const ariaProps =
    selectionMode === 'single'
      ? ({ role: 'radio', 'aria-checked': selected } as const)
      : ({ 'aria-pressed': selected } as const);

  return (
    <button
      type="button"
      {...ariaProps}
      {...props}
      className={cn(
        'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-small font-medium',
        'transition-colors duration-micro ease-expo',
        selected
          ? 'border-accent bg-accent text-paper'
          : 'border-line-light bg-paper text-ink hover:border-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Groups chips so screen readers announce them as one question. */
export function ChipGroup({
  label,
  selectionMode = 'single',
  className,
  children,
}: {
  label: string;
  selectionMode?: 'single' | 'multiple';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={cn('flex flex-col gap-3', className)}>
      <legend className="mb-1 text-small font-semibold text-ink">{label}</legend>
      <div
        role={selectionMode === 'single' ? 'radiogroup' : 'group'}
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {children}
      </div>
    </fieldset>
  );
}
