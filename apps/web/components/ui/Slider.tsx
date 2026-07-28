'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  /** Hide the visual label when the field above already carries it (LoanCalculator). */
  hideLabel?: boolean;
  /** Human-readable value for screen readers, e.g. "1 049 000 ֏". */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

/**
 * Range slider used by the LoanCalculator down payment (synced with its number
 * input) and the China price filter. Native `input[type=range]` keeps full
 * keyboard + AT support; the fill is painted with a gradient so there is no
 * JS-driven layout on drag.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  hideLabel = false,
  formatValue,
  disabled = false,
  className,
}: SliderProps) {
  const id = useId();
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={id}
        className={cn('mb-2 block text-small font-medium', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={formatValue?.(value)}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-line-light outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paper',
          '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-card',
          '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-pill',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-paper',
          '[&::-moz-range-thumb]:bg-accent',
        )}
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-line-light) ${percent}%)`,
        }}
      />
    </div>
  );
}
