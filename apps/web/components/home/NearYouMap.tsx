import { NearYouGlobe } from '@/components/home/NearYouGlobe';
import { getBranches, branchTelHref } from '@/lib/branches';
import { getMapLocations } from '@/lib/mapLocations';
import { GlassButton } from '@/components/home/GlassButton';

/**
 * "Միշտ քո կողքին" — Figma 436:2005. A black full-bleed block: 44px light white
 * heading, then the 1067×647 map block (pins only for the places cars come from; the
 * branches are the list under it) (a draggable dotted `cobe` globe opening on
 * Armenia with a gold pin on Yerevan, over the static map poster until it draws), then the
 * glass "visit your nearest branch" button, 48px below. The button leads to the
 * Contact page, where the branches (addresses, phones, hours) live.
 */
export async function NearYouMap({
  heading,
  cta,
  href,
}: {
  heading: string;
  cta: string;
  href: string;
}) {
  const [locations, branches] = await Promise.all([getMapLocations(), getBranches()]);
  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex max-w-page flex-col items-center gap-10 px-4 py-12 sm:px-6 lg:gap-16 lg:px-12 lg:py-16">
        <h2 className="stretch-88 text-center text-[28px] font-light leading-[38px] sm:text-home-h2 sm:leading-[58px]">
          {heading}
        </h2>
        <div className="flex w-full flex-col items-center gap-8 lg:gap-12">
          <NearYouGlobe poster="/images/home/v2/map-poster.webp" locations={locations} />
          {branches.length > 0 && (
            <ul className="grid w-full max-w-[1067px] grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <li key={branch.id} className="border-t border-white/20 pt-3">
                  <p className="text-[16px] font-bold leading-5">{branch.name}</p>
                  <p className="mt-1 text-[14px] leading-5 text-white/70">
                    {branch.city}, {branch.address}
                  </p>
                  <a
                    href={branchTelHref(branch.phone)}
                    className="inline-flex min-h-11 items-center text-[14px] leading-5 text-white/70 hover:text-white"
                  >
                    {branch.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <GlassButton href={href}>{cta}</GlassButton>
        </div>
      </div>
    </section>
  );
}
