'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * The block under the closing card (Figma 471:1267, 1344×192): the hero's intro again — 24/36
 * bold #3d3d3d, centred over three lines — and the same two pills 36px below it.
 */
export function AboutOutro() {
  const t = useMessages().about;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="mx-auto flex max-w-page flex-col items-center gap-9 px-4 text-center sm:px-6 lg:px-12">
      <p className="stretch-85 text-[18px] font-bold leading-7 text-neutral-800 sm:text-[24px] sm:leading-9">
        {t.hero.intro}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-[18px]">
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'about-outro-consultation' })}
          className="inline-flex h-12 items-center justify-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:min-w-[348px]"
        >
          {t.cta.consultation}
          <ArrowUpRightIcon className="size-5" />
        </button>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center justify-center gap-1 rounded-pill bg-white px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:min-w-[199px]"
        >
          {t.cta.contact}
          <ArrowUpRightIcon className="size-5" />
        </Link>
      </div>
    </section>
  );
}
