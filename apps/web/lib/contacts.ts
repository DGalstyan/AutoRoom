/**
 * Server-only fetch of admin-managed contact info (`apps/api`'s
 * `contacts.general`/`contacts.social` settings, via `GET /settings/public`)
 * — replaces Footer's hardcoded email and its misuse of `BRANCHES[0].phone`
 * (a specific branch's own number) as the company's general contact number.
 *
 * Mirrors `lib/branding.ts`'s fetch-with-safe-fallback contract exactly,
 * including the same endpoint and revalidate window — Next.js dedupes
 * identical fetches within one request, so calling this alongside
 * `getBrandingLogos()` in the same render doesn't cost a second round-trip.
 * Never throws: an unreachable API or a setting nobody has filled in yet
 * both resolve to null/empty, and callers should render nothing for that
 * field (not a hardcoded placeholder) when empty.
 */

export interface GeneralContacts {
  email: string | null;
  phones: string[];
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  linkedin: string | null;
}

interface PublicSettingsResponse {
  'contacts.general'?: { phones: string[]; email: string | null; workingHours: string };
  'contacts.social'?: SocialLinks;
}

const NO_CONTACTS: GeneralContacts = { email: null, phones: [] };
const NO_SOCIAL: SocialLinks = { facebook: null, instagram: null, tiktok: null, linkedin: null };

export async function getContacts(): Promise<{ general: GeneralContacts; social: SocialLinks }> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return { general: NO_CONTACTS, social: NO_SOCIAL };

    const data = (await res.json()) as PublicSettingsResponse;
    const general = data['contacts.general'];
    const social = data['contacts.social'];

    return {
      general: general ? { email: general.email, phones: general.phones } : NO_CONTACTS,
      social: social ?? NO_SOCIAL,
    };
  } catch {
    // Network error, DNS failure, API not running at build time, etc.
    return { general: NO_CONTACTS, social: NO_SOCIAL };
  }
}
