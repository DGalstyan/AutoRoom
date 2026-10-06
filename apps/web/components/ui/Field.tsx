'use client';

import { useId, type ReactNode } from 'react';

/**
 * Canonical form field: a **persistent, visible** label that is programmatically
 * bound to its control, plus optional hint and error text. A placeholder is
 * never a substitute for the label (it disappears on input, has weak contrast
 * and isn't reliably announced) — it may only show an *example* value.
 *
 * Usage — spread the returned props onto the control so `id`, `aria-invalid`
 * and `aria-describedby` are always wired correctly:
 *
 *   <Field label={t.nameLabel} error={error}>
 *     {(a11y) => <input {...a11y} className={fieldControlClass} />}
 *   </Field>
 */
export interface FieldControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export const fieldControlClass =
  'h-12 w-full rounded-md border border-line-light bg-white px-4 text-body text-ink outline-none ' +
  'placeholder:text-neutral-600 focus:border-accent focus-visible:ring-2 focus-visible:ring-accent ' +
  'aria-[invalid=true]:border-error disabled:opacity-50';

export function Field({
  label,
  hint,
  error,
  required = false,
  group = false,
  className = '',
  labelClassName = 'text-small font-medium text-ink',
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** For a set of buttons/radios rather than one control: labels a `role="group"` instead of a `<label for>`. */
  group?: boolean;
  className?: string;
  /** Override the label's type styles for compact layouts (calculators); keep it visible and ≥12px. */
  labelClassName?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const labelContent = (
    <>
      {label}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
      )}
    </>
  );

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      {...(group ? { role: 'group', 'aria-labelledby': `${id}-label` } : {})}
    >
      {group ? (
        <span id={`${id}-label`} className={labelClassName}>
          {labelContent}
        </span>
      ) : (
        <label htmlFor={id} className={labelClassName}>
          {labelContent}
        </label>
      )}
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}
      {hint && (
        <p id={hintId} className="text-caption text-neutral-700">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-small text-error">
          {error}
        </p>
      )}
    </div>
  );
}
