import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-600 focus-visible:outline-accent',
  secondary: 'bg-white text-ink hover:bg-white/90 focus-visible:outline-white',
  ghost: 'bg-transparent text-inherit hover:bg-white/10 focus-visible:outline-current',
  outline:
    'bg-transparent border border-current text-inherit hover:bg-white/10 focus-visible:outline-current',
};

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
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

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

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
