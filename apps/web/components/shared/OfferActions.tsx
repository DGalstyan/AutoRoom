'use client';

import Link from 'next/link';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { PromoCountdown } from '@/components/shared/PromoCountdown';
import { usePromoClock } from '@/components/shared/usePromoClock';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';

/**
 * The live part of an offer's detail page: status line, countdown and the buttons. While the
 * promotion runs the main button asks for the offer; the moment it ends the page closes it by
 * itself (no reload) — the offer button gives way to "similar offer" and a link to current offers.
 */
export function OfferActions({
  deadline,
  initialExpired,
  car,
  carHref,
}: {
  deadline: string;
  /** Server's view at render time, so an already-expired offer is closed from the first paint. */
  initialExpired: boolean;
  car: UniversalPopupCarContext;
  carHref: string;
}) {
  const t = useMessages().offers.detail;
  const { openUniversal } = useLeadWidgets();
  const { status } = usePromoClock(deadline);
  const expired = status === 'expired' || (status === null && initialExpired);

  const primary =
    'inline-flex h-12 items-center justify-center rounded-pill px-6 text-[14px] font-medium transition-colors duration-standard ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <div className="flex flex-col gap-4">
      {expired ? (
        <div role="status" className="flex flex-col gap-2 rounded-[20px] bg-neutral-50 p-5">
          <p className="text-[18px] font-bold leading-7 text-neutral-900">{t.expiredTitle}</p>
          <p className="text-[14px] leading-6 text-neutral-700">{t.expiredText}</p>
        </div>
      ) : (
        <p
          className={`inline-flex w-fit items-center gap-2 rounded-pill px-4 py-2 text-[14px] font-medium leading-5 ${
            status === 'ending-soon' ? 'bg-error text-white' : 'bg-neutral-50 text-neutral-800'
          }`}
        >
          {status === 'ending-soon' ? t.statusEndingSoon : t.statusActive}
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {t.timeLeft}: <PromoCountdown deadline={deadline} />
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {expired ? (
          <>
            <button
              type="button"
              onClick={() => openUniversal({ sourceCta: 'offer-detail-similar', car })}
              className={`${primary} bg-accent text-ink hover:bg-accent-600`}
            >
              {t.expiredCta}
            </button>
            <Link
              href="/offers"
              className={`${primary} bg-neutral-50 text-ink hover:bg-neutral-100`}
            >
              {t.currentOffers}
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openUniversal({ sourceCta: 'offer-detail-get-offer', car })}
              className={`${primary} bg-accent text-ink hover:bg-accent-600`}
            >
              {t.cta}
            </button>
            <Link
              href={carHref}
              className={`${primary} bg-neutral-50 text-ink hover:bg-neutral-100`}
            >
              {t.viewCar}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
