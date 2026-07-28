'use client';

import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { BANKS, type Bank } from '@/data/banks';
import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * "Գնել Վարկով" — the bank grid that sits above `LoanCalculator` in the
 * car-detail right column.
 *
 * The behavioural split matters: partner-bank tiles are external links that open
 * the bank's own application in a new tab (`rel="noopener"`, enforced by
 * `Button`), while the AutoRoom tile keeps the user on the page and shows our
 * in-house offer — financing before the car reaches Armenia, up to 2 months, up
 * to 70% of the value.
 */

export interface BuyWithLoanProps {
  sticky?: boolean;
  className?: string;
}

export function BuyWithLoan({ sticky = false, className }: BuyWithLoanProps) {
  const [offerOpen, setOfferOpen] = useState(false);
  const { openUniversal } = useLeadWidget();

  return (
    <section
      className={cn(
        'rounded-lg border border-line-light bg-paper p-6 shadow-card',
        sticky && 'lg:sticky lg:top-[calc(var(--header-height)+24px)]',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-surface-light"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink" fill="none" stroke="currentColor">
            <path
              d="M3 9.5L12 4l9 5.5M5 10v9m14-9v9M3 19h18M9 19v-5h6v5"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h3 className="text-lead font-bold">{t('buyWithLoan.title')}</h3>
          <p className="text-caption text-muted">{t('buyWithLoan.subtitle')}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {BANKS.map((bank) => (
          <BankTile key={bank.id} bank={bank} onInHouse={() => setOfferOpen(true)} />
        ))}
      </div>

      <Dialog
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        title={t('buyWithLoan.autoroomOffer.title')}
        size="md"
      >
        <p className="text-body text-muted">{t('buyWithLoan.autoroomOffer.text')}</p>
        <Button
          className="mt-6"
          fullWidth
          onClick={() => {
            setOfferOpen(false);
            openUniversal({ sourceCta: t('buyWithLoan.autoroomOffer.title') });
          }}
        >
          {t('common.cta.getOffer')}
        </Button>
      </Dialog>
    </section>
  );
}

function BankTile({ bank, onInHouse }: { bank: Bank; onInHouse: () => void }) {
  const tile = cn(
    'flex h-20 items-center justify-center rounded-md border bg-paper px-3 text-center',
    'text-small font-semibold transition-all duration-standard ease-expo',
    'hover:-translate-y-0.5 hover:shadow-card',
    bank.inHouse ? 'border-accent text-accent' : 'border-line-light text-ink',
  );

  const content = bank.logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo assets are plain files, see CarImage
    <img src={bank.logo} alt={bank.name} className="max-h-10 w-auto object-contain" />
  ) : (
    bank.name
  );

  if (bank.inHouse) {
    return (
      <button type="button" onClick={onInHouse} className={tile}>
        {content}
      </button>
    );
  }

  return (
    <a href={bank.url} target="_blank" rel="noopener noreferrer" className={tile}>
      {content}
    </a>
  );
}
