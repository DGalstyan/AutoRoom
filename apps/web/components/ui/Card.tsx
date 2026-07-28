import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cards sit on light sections by default; `dark` is for hero/About surfaces. */
  tone?: 'light' | 'dark';
  /** Cards lift on hover (translateY(-4px) + stronger shadow). */
  hoverLift?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
  children: React.ReactNode;
}

export function Card({
  tone = 'light',
  hoverLift = false,
  as = 'div',
  className,
  children,
  ...props
}: CardProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      {...props}
      className={cn(
        'rounded-lg border',
        tone === 'light'
          ? 'border-line-light bg-paper text-ink shadow-card'
          : 'on-dark border-line bg-surface text-paper',
        hoverLift &&
          'transition-all duration-standard ease-expo hover:-translate-y-1 hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
