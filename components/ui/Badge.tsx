import { cn } from '@/lib/utils';

/**
 * Status badge. Colour mapping is fixed by the design tokens:
 * Available=success · On order / On the road=warn · Auction=accent · Sold/past=muted.
 */
export type BadgeTone = 'available' | 'on-order' | 'on-road' | 'auction' | 'past' | 'info';

const tones: Record<BadgeTone, string> = {
  available: 'bg-success/12 text-success border-success/30',
  'on-order': 'bg-warn/12 text-warn border-warn/30',
  'on-road': 'bg-warn/12 text-warn border-warn/30',
  auction: 'bg-accent/10 text-accent border-accent/30',
  past: 'bg-muted/12 text-muted border-muted/30',
  info: 'bg-info/10 text-info border-info/30',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: React.ReactNode;
}

export function Badge({ tone = 'info', className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
