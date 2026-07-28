import { cn } from '@/lib/utils';

/**
 * Routing-skeleton heading. Phase 0 ships every route rendering its H1 so the
 * information architecture is real before the sections land in Phases 2–6.
 */
export function PageHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <section className={cn('container-page section-y', className)}>
      <h1 className="max-w-4xl text-h1">{title}</h1>
      {subtitle ? <p className="mt-6 max-w-2xl text-lead text-muted">{subtitle}</p> : null}
    </section>
  );
}
