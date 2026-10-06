'use client';

import { useId } from 'react';
import { Chip } from '@/components/ui/Chip';
import { fieldControlClass } from '@/components/ui/Field';

export interface QuickChoiceOption<K extends string> {
  key: K;
  label: string;
}

/** More options than this and a row of chips stops being "quick" — fall back to a dropdown. */
export const MAX_CHIP_OPTIONS = 4;

/**
 * One-tap answer to a closed question (budget, financing, timing, channel…).
 * ≤4 options render as chips (one tap, all options visible); more render as a
 * native dropdown so the form never grows a wall of pills. Either way the
 * label is persistent and visible, and the answer is optional — tapping the
 * selected chip again (or choosing the blank dropdown entry) clears it.
 */
export function QuickChoice<K extends string>({
  label,
  options,
  value,
  onChange,
  clearLabel = '—',
}: {
  label: string;
  options: QuickChoiceOption<K>[];
  value: K | undefined;
  onChange: (value: K | undefined) => void;
  /** Text of the blank dropdown entry. */
  clearLabel?: string;
}) {
  const id = useId();

  if (options.length > MAX_CHIP_OPTIONS) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
        </label>
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange((event.target.value || undefined) as K | undefined)}
          className={fieldControlClass}
        >
          <option value="">{clearLabel}</option>
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="mb-2 text-small font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.key}
            selected={value === option.key}
            onClick={() => onChange(value === option.key ? undefined : option.key)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
