'use client';

import Image from 'next/image';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { Bank } from '@/lib/banks';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import { messages } from '@/lib/messages';

const t = messages.china.detail.buyWithLoan;

/**
 * China/USA car-detail S3.6b right-column card — a compact, single-bank-per-
 * row variant of the listing page's `ChinaFinancing` grid (Figma node
 * 102:558/102:560: 4 stacked full-width rows, not the 2×2 grid
 * `components.md` sketches in the abstract). Partner banks open their
 * online auto-loan application in a new tab; the in-house row opens the
 * per-car `UniversalPopup` instead of leaving the site.
 */
export function BuyWithLoan({ banks, car }: { banks: Bank[]; car: UniversalPopupCarContext }) {
  const { openUniversal } = useLeadWidgets();

  if (banks.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-[24px] font-semibold leading-[32px] text-ink">
        {t.heading}
      </h2>
      <p className="mt-1 text-[14px] text-muted">{t.subline}</p>

      <div className="mt-4 flex flex-col gap-3">
        {banks.map((bank) =>
          bank.inHouse ? (
            <button
              key={bank.id}
              type="button"
              onClick={() =>
                openUniversal({ sourceCta: 'china-detail-buy-with-loan-in-house', car })
              }
              className="flex h-[90px] items-center justify-center rounded-xl border-2 border-accent bg-white p-3 transition-transform duration-standard hover:-translate-y-0.5"
            >
              {bank.logoUrl ? (
                <Image
                  src={bank.logoUrl}
                  alt={bank.name}
                  width={143}
                  height={55}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[16px] font-medium text-ink">{bank.name}</span>
              )}
            </button>
          ) : bank.loanUrl ? (
            <a
              key={bank.id}
              href={bank.loanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[90px] items-center justify-center rounded-xl bg-white p-3 transition-transform duration-standard hover:-translate-y-0.5"
            >
              {bank.logoUrl ? (
                <Image
                  src={bank.logoUrl}
                  alt={bank.name}
                  width={277}
                  height={53}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[16px] font-medium text-neutral-800">{bank.name}</span>
              )}
            </a>
          ) : (
            <div
              key={bank.id}
              className="flex h-[90px] items-center justify-center rounded-xl bg-white p-3"
            >
              {bank.logoUrl ? (
                <Image
                  src={bank.logoUrl}
                  alt={bank.name}
                  width={277}
                  height={53}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[16px] font-medium text-neutral-800">{bank.name}</span>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
