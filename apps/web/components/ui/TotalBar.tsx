import type { ReactNode } from 'react';
import { Price } from '@/components/ui/Price';

/**
 * Calculator / breakdown hierarchy — three visibly different tiers:
 *
 *   1. INPUTS     — white card, bold label + control (`Field`).
 *   2. BREAKDOWN  — quiet rows: 16px regular label, 16px/500 tabular value,
 *                   hairline dividers (`BreakdownRow`). Nothing here is bold
 *                   or larger than body text, so it never competes with (3).
 *   3. TOTAL      — `TotalBar`: a dark block, the only one in the calculator,
 *                   with the result at 28px (phone) / 36px (≥sm), weight 700,
 *                   tabular numerals.
 */
export function TotalBar({
  label,
  value,
  children,
  tone = 'dark',
  className = '',
}: {
  label: string;
  value: string;
  /** `light` is the white card the China price-journey frame draws (Figma 442:9181). */
  tone?: 'dark' | 'light';
  /** Optional supporting line under the total (e.g. the addends of the sum). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        tone === 'light'
          ? `rounded-[20px] bg-white px-4 py-6 text-ink ${className}`
          : `rounded-lg bg-ink p-6 text-white ${className}`
      }
    >
      <p
        className={
          tone === 'light'
            ? 'text-[16px] leading-6 text-ink'
            : 'text-small font-medium text-white/70'
        }
      >
        {label}
      </p>
      <Price
        as="p"
        size="total"
        className={`mt-1 ${tone === 'light' ? 'text-neutral-800' : 'text-white'}`}
      >
        {value}
      </Price>
      {children && (
        <div
          className={`mt-3 text-small tabular-nums ${tone === 'light' ? 'text-neutral-700' : 'text-white/70'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-light py-3 last:border-b-0">
      <span className="text-body text-neutral-700">{label}</span>
      <span className="text-body font-medium tabular-nums text-neutral-800">{value}</span>
    </div>
  );
}
