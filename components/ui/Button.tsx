import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-pill font-body font-semibold ' +
  'transition-all duration-standard ease-expo disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-paper hover:bg-accent-600 hover:-translate-y-0.5 shadow-card',
  outline: 'border border-current text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-ink hover:bg-surface-light',
  dark: 'bg-ink text-paper hover:bg-surface',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-small',
  md: 'h-11 px-6 text-body',
  lg: 'h-14 px-8 text-lead',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: never;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
    /** External links must open in a new tab with rel="noopener". */
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', fullWidth, className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);

  if ('href' in props && props.href !== undefined) {
    const {
      href,
      external,
      variant: _v,
      size: _s,
      fullWidth: _f,
      className: _c,
      children: _ch,
      ...rest
    } = props;
    const isExternal = external ?? /^https?:\/\//.test(href);

    // External links always open in a new tab with rel="noopener" (bank + auction links).
    if (isExternal) {
      return (
        <a {...rest} href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link {...rest} href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, fullWidth: _f, className: _c, children: _ch, ...rest } = props;
  return (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  );
}
