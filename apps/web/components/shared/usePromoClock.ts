'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { promoStatus, type PromoStatus } from '@/lib/promo';

/**
 * Live status of a promotion. `now` is `null` until mounted (so the server render and first
 * client render match). It ticks every 30 s — every second in the final two minutes — and a timer
 * set for the exact deadline flips it to `expired` the moment the promotion ends, then refreshes
 * the route once so server-rendered parts (card badge, grayscale, lists) catch up with no reload.
 */
export function usePromoClock(deadline: string): {
  now: number | null;
  status: PromoStatus | null;
} {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(deadline).getTime();
    if (Number.isNaN(end)) return;
    let refreshed = false;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= end && !refreshed) {
        refreshed = true;
        router.refresh();
      }
    };
    queueMicrotask(tick);

    const left = end - Date.now();
    const interval = window.setInterval(tick, left <= 120_000 ? 1_000 : 30_000);
    // setTimeout caps at ~24.8 days; the 30 s interval covers anything further out.
    const exact = left > 0 && left < 2 ** 31 - 1 ? window.setTimeout(tick, left + 50) : undefined;
    return () => {
      window.clearInterval(interval);
      if (exact !== undefined) window.clearTimeout(exact);
    };
  }, [deadline, router]);

  return { now, status: now === null ? null : promoStatus(deadline, now) };
}
