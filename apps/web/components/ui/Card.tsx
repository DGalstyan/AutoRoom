import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Canonical card. One radius scale, one padding scale, three surfaces — pick
 * from these props instead of hand-writing `rounded-[32px] bg-white p-…`.
 *
 * - `tone`: `light` = white card on a light section (default), `muted` =
 *   tinted inner card/stat well, `dark` = card on a dark section.
 * - `radius`: `xl` = 32px section/feature card (Figma card radius, default),
 *   `lg` = 20px compact card (list rows, nested cards).
 * - `padding`: `md` 24px (default), `lg` 32px, `sm` 16px, `none` when the
 *   card's content is full-bleed (images).
 * - `raised`: adds the one shared card shadow — only for the single hero
 *   card in a group, not every card.
 * - `interactive`: the whole card is a link/button target — adds hover lift
 *   and a focus ring on the focusable child via `focus-within`.
 */
type Tone = 'light' | 'muted' | 'dark';
type Radius = 'xl' | 'lg';
type Padding = 'none' | 'sm' | 'md' | 'lg';

const TONE: Record<Tone, string> = {
  light: 'bg-white text-ink',
  muted: 'bg-neutral-25 text-ink',
  dark: 'bg-surface text-white border border-white/10',
};
const RADIUS: Record<Radius, string> = { xl: 'rounded-xl', lg: 'rounded-lg' };
const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section' | 'li';
  tone?: Tone;
  radius?: Radius;
  padding?: Padding;
  raised?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  as: Tag = 'div',
  tone = 'light',
  radius = 'xl',
  padding = 'md',
  raised = false,
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    TONE[tone],
    RADIUS[radius],
    PADDING[padding],
    raised ? 'shadow-card' : '',
    interactive
      ? 'transition-transform duration-standard ease-expo hover:-translate-y-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
