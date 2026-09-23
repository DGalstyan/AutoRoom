'use client';

import { Button } from '@/components/ui/Button';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S4 "Portal login" (`references/pages.md` §5): heading +
 * `Մուտք գործել` → `/partners/portal`. Not in the Figma mock at all (see
 * `app/partners/page.tsx`'s prior doc comment) — a plain centered
 * heading+CTA, matching the spec line rather than inventing a busier layout
 * for a section this small.
 */
export function PartnersPortalCta() {
  const t = useMessages().partners.portalCta;

  return (
    <section className="bg-surface-light px-4 pb-14 sm:px-6 sm:pb-24">
      <div className="mx-auto flex max-w-container flex-col items-center gap-6 rounded-[32px] bg-white px-6 py-14 text-center shadow-card sm:py-20">
        <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
        <Button href="/partners/portal" variant="primary" size="lg">
          {t.cta}
        </Button>
      </div>
    </section>
  );
}
