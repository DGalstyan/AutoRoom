'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Back to wherever the visitor came from: when they arrived from a page of this site (a China
 * or USA car, a listing) the browser's own back step is used, otherwise it is a plain link to
 * `href` (the first car of the comparison), which is also what it is without JavaScript.
 */
export function CompareBackLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      aria-label={label}
      className={className}
      onClick={(event) => {
        try {
          const ref = document.referrer ? new URL(document.referrer) : null;
          if (ref && ref.origin === window.location.origin && ref.pathname !== '/compare') {
            event.preventDefault();
            router.back();
          }
        } catch {
          /* fall through to the link */
        }
      }}
    >
      {children}
    </Link>
  );
}
