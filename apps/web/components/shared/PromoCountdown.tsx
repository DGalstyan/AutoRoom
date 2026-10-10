'use client';

import { useMessages } from '@/components/shared/LocaleProvider';
import { usePromoClock } from '@/components/shared/usePromoClock';
import { formatCountdown } from '@/lib/promo';

/**
 * Live countdown to a promotion's deadline, in the visitor's language (Armenian: «12 օր 3 ժ 5 ր»).
 * At the deadline it turns into «Ավարտված» by itself and refreshes the page data — nothing about an
 * expired promotion stays open. A small client leaf, so the server-rendered `CarCard` stays a
 * Server Component. Renders nothing until mounted, so it can't cause a hydration mismatch.
 */
export function PromoCountdown({ deadline }: { deadline: string }) {
  const t = useMessages().common.carCard;
  const { now, status } = usePromoClock(deadline);

  if (now === null) return null;
  if (status === 'expired') return <>{t.promoEnded}</>;
  return <>{formatCountdown(deadline, t.countdown, now)}</>;
}
