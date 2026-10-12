'use client';

import Link from 'next/link';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';

/** The offer button (Universal popup, "Construction machinery" pre-selected) and a link to Contact. */
export function MachineryActions({ cta, contact }: { cta: string; contact: string }) {
  const { openUniversal } = useLeadWidgets();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() =>
          openUniversal({ sourceCta: 'machinery-hero', preselect: { interest: 'machinery' } })
        }
        className="inline-flex h-12 items-center justify-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {cta}
      </button>
      <Link
        href="/contact"
        className="inline-flex h-12 items-center justify-center rounded-pill bg-white px-6 text-[14px] font-medium text-ink transition-colors duration-standard hover:bg-neutral-50"
      >
        {contact}
      </Link>
    </div>
  );
}
