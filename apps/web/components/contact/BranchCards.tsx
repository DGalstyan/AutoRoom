import Image from 'next/image';
import { getBranches, branchMapsUrl } from '@/lib/branches';
import { getServerMessages } from '@/lib/i18n';
import { ArrowUpRightIcon } from '@/components/ui/icons';

/**
 * Contact `/contact` S2 (`references/pages.md` "8. Contact" S2: "BranchMap +
 * 3 branch cards, CTA `Ուղղություն` → Google Maps"). Figma node `141:989`
 * (file `9Lq4XpWusTJj1VnM6laAZr`): a single column of full-width cards (not
 * a 3-up grid — pixel-audit correction from an earlier pass), each a
 * horizontal split — name/address/hours/CTA on the left, a photo on the
 * right filling the card's height — verified via Dev Mode CSS (`rounded-xl
 * bg-white p-9 shadow-card`, `flex justify-between items-center`, same card
 * treatment as `ContactInfo`/`ContactForm`). Figma's own 3 cards are the
 * exact same lorem placeholder repeated ("Մասնաճյուղ #1" / "Սարյան 1,
 * Երևան, Հայաստան" / "10:00-13:00" three times over), not real per-branch
 * content — replaced with the real admin-managed `getBranches()` data (same
 * source `BranchMap` and `Footer` use).
 *
 * "Ուղղություն" prefers the admin's own `mapUrl` when set (`branchMapsUrl`),
 * falling back to a generated Google Maps search only when a branch has
 * none.
 *
 * No `BranchMap` (the Armenia pin map) here — it's not present in this
 * Figma frame, only the card list.
 */
export async function BranchCards() {
  const [branches, { messages }] = await Promise.all([getBranches(), getServerMessages()]);
  const t = messages.contact.branches;
  if (branches.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 lg:gap-16">
      <h2 className="stretch-88 text-[28px] font-light leading-[38px] text-ink sm:text-home-h2 sm:leading-[58px]">
        {t.heading}
      </h2>
      <div className="flex flex-col gap-6 lg:gap-9">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="flex flex-col gap-6 rounded-[32px] bg-white p-6 shadow-[0_1px_12px_rgba(19,15,38,0.04)] sm:p-9 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex flex-col justify-center gap-6 lg:w-[412px] lg:shrink-0 lg:gap-9">
              <p className="stretch-90 text-[28px] font-normal leading-9 text-ink lg:text-[36px] lg:leading-[48px]">
                {branch.name}
              </p>
              <div className="flex flex-col gap-[18px] text-[20px] leading-7 text-neutral-800">
                <p className="stretch-93 flex items-center gap-2">
                  <PinIcon />
                  {branch.city ? `${branch.address}, ${branch.city}` : branch.address}
                </p>
                <p className="stretch-93 flex items-center gap-2">
                  <ClockIcon />
                  {t.hoursPrefix}: {branch.hours}
                </p>
              </div>
              <a
                href={branchMapsUrl(branch)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[60px] w-fit items-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-5 text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t.cta} <ArrowUpRightIcon className="size-5" />
              </a>
            </div>

            <div className="relative aspect-[690/421] w-full overflow-hidden rounded-[30px] bg-gradient-to-br from-surface-light via-neutral-100 to-neutral-50 text-ink/60 lg:w-[690px] lg:shrink-0">
              {branch.photoUrl ? (
                <Image
                  src={branch.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 690px, 100vw"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-lead font-semibold">
                  {branch.city}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M10 18s6-5.686 6-10a6 6 0 1 0-12 0c0 4.314 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
