import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  tone?: 'dark' | 'light';
  className?: string;
  children: ReactNode;
}

/** Consistent section rhythm: 96px desktop / 56px mobile vertical padding, 1280px container. */
export function Section({ id, tone = 'dark', className = '', children }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-14 sm:py-24 ${tone === 'dark' ? 'bg-bg text-white' : 'bg-surface-light text-ink'} ${className}`}
    >
      <div className="mx-auto max-w-container px-4 sm:px-6">{children}</div>
    </section>
  );
}
