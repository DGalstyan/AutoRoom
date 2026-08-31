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
 * 102:558/102:560: 4 plain white stacked rows — no subline under the
 * heading, no special border on the in-house row, both of which
 * `components.md`'s abstract sketch implies but this actual frame doesn't
 * have). Partner banks open their online auto-loan application in a new tab;
 * the in-house row opens the per-car `UniversalPopup` instead of leaving the
 * site.
 */
export function BuyWithLoan({ banks, car }: { banks: Bank[]; car: UniversalPopupCarContext }) {
  const { openUniversal } = useLeadWidgets();

  if (banks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-[20px] font-bold leading-[32px] text-neutral-800">
        {t.heading}
      </h2>

      <div className="flex flex-col gap-3">
        {banks.map((bank) =>
          bank.inHouse ? (
            <button
              key={bank.id}
              type="button"
              onClick={() =>
                openUniversal({ sourceCta: 'china-detail-buy-with-loan-in-house', car })
              }
              className="flex h-[90px] items-center justify-center rounded-md bg-white p-3 transition-transform duration-standard hover:-translate-y-0.5"
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
              className="flex h-[90px] items-center justify-center rounded-md bg-white p-3 transition-transform duration-standard hover:-translate-y-0.5"
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
              className="flex h-[90px] items-center justify-center rounded-md bg-white p-3"
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
