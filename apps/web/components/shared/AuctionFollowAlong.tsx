'use client';

import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA auction car-detail "Հետևել աճուրդին օնլայն": the View-Only (guest login)
 * explanation under the hero. The numbered "Ինչպե՞ս է աշխատում" steps and the two CTAs
 * are the black band that follows it — `AuctionHowItWorks`.
 */
export function AuctionFollowAlong() {
  const t = useMessages().common.carDetail.auctionFollowAlong;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="type-h2 text-ink">{t.heading}</h2>
      <div className="flex flex-col gap-[10px] text-[18px] leading-7 text-neutral-800 sm:text-[24px] sm:leading-9">
        <p>{t.intro1}</p>
        <p>{t.intro2}</p>
        <div>
          <p>{t.listIntro}</p>
          <ul className="ml-5 list-disc">
            {t.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p>{t.disclaimer}</p>
      </div>
    </div>
  );
}
