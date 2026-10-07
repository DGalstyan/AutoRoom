'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` closing band (Figma `Text` 441:5185): the shared black band with
 * the glass button — `Մուտք գործել` → `/partners/portal`. It follows the "who
 * can join" panel by 150px.
 */
export function PartnersPortalCta() {
  const t = useMessages().partners.portalCta;

  return (
    <div className="bg-surface-light pt-16 lg:pt-[202px]">
      <CtaBand heading={t.heading} buttonLabel={t.cta} href="/partners/portal" />
    </div>
  );
}
