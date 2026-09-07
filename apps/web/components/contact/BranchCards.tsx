import Image from 'next/image';
import { getBranches, branchMapsUrl } from '@/lib/branches';
import { getServerMessages } from '@/lib/i18n';

/**
 * Contact `/contact` S2 (`references/pages.md` "8. Contact" S2: "BranchMap +
 * 3 branch cards, CTA `Ուղղություն` → Google Maps"). Figma node `141:989`
 * (file `9Lq4XpWusTJj1VnM6laAZr`): 3 cards, each with a photo, address,
 * hours, and a "Ուղղություն →" pill — but Figma's own 3 cards are the exact
 * same lorem placeholder repeated ("Մասնաճյուղ #1" / "Սարյան 1, Երևան,
 * Հայաստան" / "10:00-13:00" three times over), not real per-branch content.
 * Now pulls the real admin-managed `getBranches()` data (same source
 * `BranchMap` and `Footer` use) so each card actually differs — including
 * the photo Figma's own card calls for, which the API has carried since a
 * recent pass but nothing on the public site rendered yet. A branch with no
 * photo uploaded shows its city name over a plain gradient instead of a
 * broken image, same fallback `BranchMap`'s panel uses.
 *
 * "Ուղղություն" now prefers the admin's own `mapUrl` when set
 * (`branchMapsUrl`), falling back to a generated Google Maps search only
 * when a branch has none.
 *
 * No `BranchMap` (the Armenia pin map) here — it's not present in this
 * Figma frame, only the card grid.
 */
export async function BranchCards() {
  const [branches, { messages }] = await Promise.all([getBranches(), getServerMessages()]);
  const t = messages.contact.branches;
  if (branches.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {branches.map((branch) => (
          <div key={branch.id} className="overflow-hidden rounded-xl bg-white shadow-card">
            <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-surface-light via-neutral-100 to-neutral-50 text-ink/60">
              {branch.photoUrl ? (
                <Image
                  src={branch.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <span className="font-display text-lead font-semibold">{branch.city}</span>
              )}
            </div>
            <div className="p-6">
              <p className="font-display font-semibold text-ink">
                {branch.name} — {branch.city}
              </p>
              <p className="mt-2 text-small text-ink/70">{branch.address}</p>
              <p className="mt-1 text-small text-ink/70">
                {t.hoursPrefix}: {branch.hours}
              </p>
              <a
                href={branchMapsUrl(branch)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-pill bg-accent px-5 py-2.5 text-small font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
              >
                {t.cta} <ArrowIcon />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 12 12 4M12 4H6M12 4v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
