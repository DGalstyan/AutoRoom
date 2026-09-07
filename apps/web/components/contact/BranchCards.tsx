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
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="mt-8 flex flex-col gap-9">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="flex flex-col gap-6 rounded-xl bg-white p-9 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-3">
              <p className="font-display text-branch-card-title font-normal text-ink">
                {branch.name} — {branch.city}
              </p>
              <p className="inline-flex items-center gap-2 text-lead text-ink/70">
                <PinIcon />
                {branch.address}
              </p>
              <p className="inline-flex items-center gap-2 text-lead text-ink/70">
                <ClockIcon />
                {t.hoursPrefix}: {branch.hours}
              </p>
              <a
                href={branchMapsUrl(branch)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 w-fit items-center gap-1 rounded-pill bg-accent px-5 py-2.5 text-small font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
              >
                {t.cta} <ArrowUpRightIcon />
              </a>
            </div>

            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-surface-light via-neutral-100 to-neutral-50 text-ink/60 sm:aspect-auto sm:h-full sm:min-h-[220px] sm:w-2/5 sm:self-stretch">
              {branch.photoUrl ? (
                <Image
                  src={branch.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 40vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-lead font-semibold">
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
      width="20"
      height="20"
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
      width="20"
      height="20"
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
