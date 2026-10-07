import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  tone?: 'dark' | 'light';
  /** The 1440px-canvas layout: 1344px content column with 48px gutters (Figma "Main pages"). */
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

/** Consistent section rhythm: 96px desktop / 56px mobile vertical padding, 1280px container. */
export function Section({
  id,
  tone = 'dark',
  wide = false,
  className = '',
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`py-14 sm:py-24 ${tone === 'dark' ? 'bg-bg text-white' : 'bg-surface-light text-ink'} ${className}`}
    >
      <div
        className={
          wide ? 'mx-auto max-w-page px-4 sm:px-6 lg:px-12' : 'mx-auto max-w-container px-4 sm:px-6'
        }
      >
        {children}
      </div>
    </section>
  );
}
