'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';

/**
 * Smallest interactive leaf for the footer's "{ctaHeading} / {ctaButton}"
 * block — Figma's own "Let's Chat" (node `125:1413`) is 64px/80px leading,
 * not the smaller 36–48px this had.
 */
export function FooterCta({ label }: { label: string }) {
  const { openUniversal } = useLeadWidgets();

  return (
    <button
      type="button"
      onClick={() => openUniversal({ sourceCta: 'footer-cta' })}
      className="mt-2 inline-flex items-center gap-3 font-display text-[40px] font-normal leading-[1.25] text-white transition-colors hover:text-accent sm:text-[64px]"
    >
      {label}
      <ArrowGlyph />
    </button>
  );
}

function ArrowGlyph() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4 12 12 4M12 4H5M12 4v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
