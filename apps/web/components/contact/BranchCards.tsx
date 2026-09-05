import { BRANCHES } from '@/lib/data/branches';
import { getServerMessages } from '@/lib/i18n';

/**
 * Contact `/contact` S2 (`references/pages.md` "8. Contact" S2: "BranchMap +
 * 3 branch cards, CTA `Ուղղություն` → Google Maps"). Figma node `141:989`
 * (file `9Lq4XpWusTJj1VnM6laAZr`): 3 cards, each with a photo, address,
 * hours, and a "Ուղղություն →" pill — but Figma's own 3 cards are the exact
 * same lorem placeholder repeated ("Մասնաճյուղ #1" / "Սարյան 1, Երևան,
 * Հայաստան" / "10:00-13:00" three times over), not real per-branch content.
 * Replaced with the real `BRANCHES` data (same source `BranchMap` and
 * `Footer` use) so each card actually differs.
 *
 * No `BranchMap` (the Armenia pin map) here — it's not present in this
 * Figma frame, only the card grid. `lib/data/branches.ts` already earmarks
 * this page as a planned `BranchMap` consumer too; left for a follow-up
 * rather than added speculatively against what Figma actually shows.
 */
export async function BranchCards() {
  const { messages } = await getServerMessages();
  const t = messages.contact.branches;

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {BRANCHES.map((branch) => (
          <div key={branch.id} className="rounded-xl bg-white p-6 shadow-card">
            <p className="font-display font-semibold text-ink">
              {branch.name} — {branch.city}
            </p>
            <p className="mt-2 text-small text-ink/70">{branch.address}</p>
            <p className="mt-1 text-small text-ink/70">
              {t.hoursPrefix}: {branch.hours}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${branch.address}, ${branch.city}, Armenia`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-pill bg-accent px-5 py-2.5 text-small font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
            >
              {t.cta} <ArrowIcon />
            </a>
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
