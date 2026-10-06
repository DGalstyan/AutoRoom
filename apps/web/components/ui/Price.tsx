import type { ElementType, ReactNode } from 'react';

/**
 * Canonical price typography: **20px (`md`) or 24px (`lg`), weight 700, tabular
 * numerals** so digits line up in columns and don't jitter while a total
 * counts up. Inter (`font-body`) is used on purpose — it ships `tnum`; the
 * display face doesn't reliably. Pass an already-formatted string
 * (`formatUsd` / `formatAmd`).
 *
 * `md` for cards and rows; `lg` for the headline price of a view (car detail
 * hero); `total` (28px → 36px from `sm`) ONLY for a calculator's result — see
 * `TotalBar`.
 */
const SIZE = {
  md: 'text-price',
  lg: 'text-price-lg',
  total: 'text-price-total sm:text-[36px] sm:leading-[44px]',
} as const;

export function Price({
  as: Tag = 'span',
  size = 'md',
  className = '',
  children,
}: {
  as?: ElementType;
  size?: keyof typeof SIZE;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`font-body font-bold tabular-nums ${SIZE[size]} ${className}`}>{children}</Tag>
  );
}
