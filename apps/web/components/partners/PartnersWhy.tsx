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

  return (
    <section className="bg-surface-light px-4 py-14 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-container flex-col gap-14">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1fr_1.39fr] lg:grid-rows-2">
            <StatTile item={support247} size="lg" className="lg:col-start-1 lg:row-start-1" />
            <StatTile item={specialPricing} size="lg" className="lg:col-start-2 lg:row-start-1" />
            <HeadingTile
              text={personalManager.title}
              tone="gold"
              className="lg:col-start-3 lg:row-start-1 lg:row-span-2"
            />
            <StatTile item={partnershipTerms} className="lg:col-start-4 lg:row-start-1" />
            <HeadingTile
              text={quickCalc.title}
              tone="black"
              className="lg:col-start-1 lg:col-span-2 lg:row-start-2"
            />
            <StatTile item={priorityService} className="lg:col-start-4 lg:row-start-2" />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row">
            <StatTile item={technicalSupport} className="sm:w-[calc(50%-12px)] sm:shrink-0" />
            <StatTile item={directLine} className="sm:flex-1" />
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

/** The white title+subtitle tiles — `size="lg"` for the two headline stats
 * (44px bold), regular 36px for the rest. */
function StatTile({
  item,
  size = 'md',
  className = '',
}: {
  item: WhyItem;
  size?: 'lg' | 'md';
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[274px] flex-col justify-center gap-3 rounded-[48px] bg-white p-8 lg:px-[34px] lg:py-16 ${className}`}
    >
      <p
        className={
          size === 'lg'
            ? 'font-display text-[44px] font-medium leading-[58px] text-ink'
            : 'text-[36px] leading-[48px] text-ink'
        }
      >
        {item.title}
      </p>
      {item.text && <p className="text-[24px] leading-9 text-ink">{item.text}</p>}
    </div>
  );
}

/** The gold and black single-heading tiles (Personal manager / Quick
 * calculations) — no subtitle, text centered both ways. */
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
      className={`flex min-h-[274px] items-center justify-center rounded-[48px] p-8 text-center text-[36px] leading-[48px] lg:py-16 ${
        tone === 'gold' ? 'bg-accent text-ink lg:px-12' : 'bg-ink text-white lg:px-16'
      } ${className}`}
    >
      <p>{text}</p>
    </div>
  );
}
