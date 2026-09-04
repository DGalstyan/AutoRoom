'use client';

import { useEffect, useState } from 'react';

function formatCountdown(deadline: string): string {
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return '0d, 0h, 0m';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d, ${hours}h, ${minutes}m`;
}

/**
 * Live "Xd, Yh, Zm" countdown to a promo's deadline — matches the exact
 * format of Figma's countdown pill (node `124:728`, file
 * `9Lq4XpWusTJj1VnM6laAZr`) on the /offers page's active promo cards.
 *
 * A small client-only leaf so the otherwise-server `CarCard` doesn't have to
 * become a client component just for one ticking value — Server Components
 * may render Client Components as children freely. Ticks once a minute,
 * which is all the display's own minute-granularity needs.
 */
export function PromoCountdown({ deadline }: { deadline: string }) {
  const [label, setLabel] = useState(() => formatCountdown(deadline));

  useEffect(() => {
    const id = setInterval(() => setLabel(formatCountdown(deadline)), 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return <>{label}</>;
}
