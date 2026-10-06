import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * CTA levels — one primary per view, everything else steps down:
 *   L1 `primary`   gold fill, ink text (white-on-gold fails contrast). The ONE
 *                  action the section exists for: "get an offer", "submit".
 *   L2 `outline`   same shape, 1px border, no fill — the alternative action
 *                  next to a primary. (`secondary` = white-filled L2 for use
 *                  on dark photography where an outline would be lost.)
 *   L3 `tertiary`  text-only with an underline on hover — "Back", "Cancel",
 *                  in-copy "Learn more". `ghost` is the legacy alias.
 * Sizes: `md` 44px (default, inline/forms), `lg` 48px (card/section CTAs),
 * `xl` 56px (hero and final-CTA bands only).
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'ghost';
type Size = 'md' | 'lg' | 'xl';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-600 focus-visible:outline-accent',
  secondary: 'bg-white text-ink hover:bg-white/90 focus-visible:outline-white',
  tertiary:
    'bg-transparent text-inherit underline-offset-4 hover:underline focus-visible:outline-current',
  ghost: 'bg-transparent text-inherit hover:bg-white/10 focus-visible:outline-current',
  outline:
    'bg-transparent border border-current text-inherit hover:bg-white/10 focus-visible:outline-current',
};

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
  xl: 'h-14 px-8 text-lg',
};

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill font-display font-semibold ' +
  'transition-colors duration-standard ease-expo focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest as ButtonAsLink;
    // tel:/mailto:/external links are not app routes — a plain <a> avoids
    // Next's client-side router trying (and failing) to resolve them.
    if (/^(tel:|mailto:|https?:)/.test(href)) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
