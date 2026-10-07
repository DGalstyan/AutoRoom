'use client';

import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S2 "Why become a partner" — Figma's `Metrics` group (node
 * 291:732, file 9Lq4XpWusTJj1VnM6laAZr): a bespoke 8-tile layout, not a
 * uniform grid. On the wide breakpoint: a tall gold "Personal manager"
 * tile spans both rows in column 3; a black "Quick calculations" tile
 * spans columns 1–2 on row 2 (row 1 there is the "24/7 support" /
 * "Special pricing" pair); column 4 is its own two-tile stack
 * ("Partnership terms" / "Priority service"); and a final two-tile row
 * ("Technical support" / "Direct line to the team") sits below the rest
 * at full width, matching a fixed 598px-wide tile + a flexible one in
 * Figma rather than an even split.
 *
 * Figma also carries an exact duplicate of the "24/7 support" + "Special
 * pricing" pair at the identical position (a second `Frame 1597885751`
 * sitting directly on `Frame 1597885744`) — an authoring artifact with no
 * visual effect (one tile fully hides the other), reproduced here as the
 * 8 unique tiles a viewer actually sees, not 10.
 *
 * `items[i].text` is empty for the two single-line tiles (Personal
 * manager, Quick calculations) — Figma sets those in one heading size
 * with no subtitle, unlike the title+subtitle pairs everywhere else.
 *
 * An earlier pass replaced this grid with the site's generic "photo +
 * frosted list" pattern instead; per direct user feedback that reads as
 * further from the real design, not closer to it, so this rebuilds
 * Figma's actual layout. `PartnersWhoCanJoin` (right below this one)
 * keeps the photo + list treatment — that section's own Figma frame
 * really is a photo with a list overlay, unlike this one.
 */
export function PartnersWhy() {
  const t = useMessages().partners.why;
  const [
    support247,
    specialPricing,
    personalManager,
    partnershipTerms,
    quickCalc,
    priorityService,
    technicalSupport,
    directLine,
  ] = t.items;

  // No background of its own: the hero's blurred fade runs 233px into this section
  // (Figma 441:5093), behind the tiles. The page wrapper supplies the light surface.
  return (
    <section className="px-4 pt-14 sm:px-6 lg:px-12 lg:pt-0">
      <div className="relative z-[1] mx-auto flex max-w-page flex-col gap-8 lg:gap-16">
        <h2 className="stretch-88 text-center text-[28px] font-light leading-[38px] text-ink sm:text-home-h2 sm:leading-[58px]">
          {t.heading}
        </h2>

        {/* Figma `Group 39466`: three columns 598 | 287 | 399 with 30px gaps (the
            `fr` units reproduce those exact widths at 1344px), then a 598 | 716 row. */}
        <div className="flex flex-col gap-6 lg:gap-[30px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[598fr_287fr_399fr] lg:gap-[30px]">
            <div className="flex flex-col gap-6 lg:gap-[10px]">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <StatTile item={support247} />
                <StatTile item={specialPricing} />
              </div>
              <HeadingTile
                text={quickCalc.title}
                tone="black"
                className="lg:min-h-[280px] lg:flex-1"
              />
            </div>
            <HeadingTile text={personalManager.title} tone="gold" />
            <div className="flex flex-col gap-6 lg:gap-4">
              <StatTile item={partnershipTerms} className="lg:flex-1" />
              <StatTile item={priorityService} className="lg:flex-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[598fr_716fr] lg:gap-[30px]">
            <StatTile item={technicalSupport} />
            <StatTile item={directLine} />
          </div>
        </div>
      </div>
    </section>
  );
}

interface WhyItem {
  title: string;
  text: string;
}

/** The white title+subtitle tiles (Figma `Frame 39503`, 274px tall, 34px inset). */
function StatTile({ item, className = '' }: { item: WhyItem; className?: string }) {
  return (
    <div
      className={`flex min-h-[274px] flex-col justify-center gap-3 rounded-[48px] bg-white p-8 lg:px-[34px] ${className}`}
    >
      <p className="stretch-90 text-[28px] leading-9 text-ink sm:text-[36px] sm:leading-[48px]">
        {item.title}
      </p>
      {item.text && (
        <p className="stretch-90 text-[20px] leading-[30px] text-ink sm:text-[24px] sm:leading-9">
          {item.text}
        </p>
      )}
    </div>
  );
}

/** The gold and black single-heading tiles (Personal manager / Quick
 * calculations) — no subtitle, text left-aligned and centred vertically. */
function HeadingTile({
  text,
  tone,
  className = '',
}: {
  text: string;
  tone: 'gold' | 'black';
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[274px] items-center justify-start rounded-[48px] p-8 text-left ${
        tone === 'gold' ? 'bg-accent text-ink lg:pl-[55px]' : 'bg-ink text-white lg:pl-16'
      } ${className}`}
    >
      <p className="stretch-90 text-[28px] leading-9 sm:text-[36px] sm:leading-[48px]">{text}</p>
    </div>
  );
}
