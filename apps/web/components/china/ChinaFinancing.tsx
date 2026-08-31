'use client';

import Image from 'next/image';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { Bank } from '@/lib/banks';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China S4 — partner-bank grid + AutoRoom's own in-house offer. `banks` is
 * the real admin-managed list (`GET /public/banks`); a bank with no
 * `logoUrl` yet falls back to a plain name badge instead of a dead/missing
 * logo. Pixel-matched to Figma node 101:403.
 */
export function ChinaFinancing({ banks }: { banks: Bank[] }) {
  const t = useMessages().china.financing;
  const { openUniversal } = useLeadWidgets();

  if (banks.length === 0) return null;

  // Figma's logo grid (node 101:412) holds exactly the 3 real partner
  // banks — AutoRoom's own offer is never a logo card there, it's the
  // separate in-house text block + CTA underneath.
  const partnerBanks = banks.filter((bank) => !bank.inHouse);
  const hasInHouseOffer = banks.some((bank) => bank.inHouse);

  return (
    <div className="flex flex-col items-center gap-[100px]">
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
        <p className="max-w-3xl text-[24px] font-light leading-[36px] text-ink">{t.text}</p>

        {partnerBanks.length > 0 && (
          <div className="mt-6 flex w-full flex-col items-center gap-6">
            <p className="text-[24px] font-bold leading-[36px] text-black">{t.partnersHeading}</p>
            <div className="flex w-full flex-wrap items-center justify-center gap-4">
              {partnerBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex h-[113px] min-w-[200px] flex-1 items-center justify-center rounded-xl bg-white p-3"
                >
                  {bank.logoUrl ? (
                    <Image
                      src={bank.logoUrl}
                      alt={bank.name}
                      width={242}
                      height={81}
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <span className="text-[16px] font-medium text-neutral-800">{bank.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasInHouseOffer && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="max-w-3xl text-[24px] font-light leading-[36px] text-ink">
            {t.inHouseText}
          </p>
          <button
            type="button"
            onClick={() => openUniversal({ sourceCta: 'china-financing-details' })}
            className="inline-flex items-center gap-1 rounded-pill bg-accent px-6 py-4 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-accent-600"
          >
            {t.cta}
          </button>
        </div>
      )}
    </div>
  );
}
