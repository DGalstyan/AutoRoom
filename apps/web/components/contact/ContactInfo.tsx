import { getContacts } from '@/lib/contacts';
import { branchTelHref } from '@/lib/branches';
import { getServerMessages } from '@/lib/i18n';
import { ArrowUpRightIcon } from '@/components/ui/icons';

const SOCIAL_LABELS = [
  { key: 'instagram', name: 'Instagram' },
  { key: 'facebook', name: 'Facebook' },
  { key: 'tiktok', name: 'TikTok' },
  { key: 'linkedin', name: 'Linkedin' },
] as const;

/**
 * Contact `/contact` S1 left column (`references/pages.md` "8. Contact" S1).
 * Figma node `141:829` (file `9Lq4XpWusTJj1VnM6laAZr`, read via Dev Mode):
 * email, phone, working hours, then a "Հետևեք մեզ" social list. Figma's own
 * mock hardcodes `hello@autoroom.co` / `+374 44 111 111` / `10:00 - 19:00` —
 * replaced with the real admin-managed `getContacts()` data (same source
 * Footer uses), same "render nothing until a field is filled in" contract.
 *
 * Figma also shows Pinterest/Youtube in its social list; those aren't
 * rendered here since the backend's `SocialLinks` type has no field for
 * them (same reasoning as Footer's own `SOCIAL_LABELS`).
 *
 * The spec additionally calls for direct WhatsApp/Viber/Telegram chat
 * buttons — neither Figma nor the backend expose real messenger deep-links
 * yet (`lib/leads.ts`'s `LeadChannel` is only a preferred-contact-method
 * chip, not an actual number), so they're left out rather than faked.
 *
 * Pixel-audit fix: this used to render as bare text directly on the page
 * background with an oversized `home-h2` heading. Figma (Dev Mode CSS,
 * `Frame 1597885985`) has it as its own white, 32px-radius card — matching
 * `ContactForm`'s card right next to it — with a compact 24px/700
 * ("Headings/H1-Bold") heading, not the 44px/300 section-heading style.
 *
 * Second pixel-audit pass (margins/padding + the "Հետևիր մեզ" block):
 * every row in this card (email/phone/hours, each social link) is the same
 * "Headings/H2-Regular" style — 20px/400/28px, `Neutral-80` (#3D3D3D) — not
 * the smaller `text-body`/full-black `text-ink` this had. Every gap
 * measured in this card comes back ~16px (`space-y-4`/`mt-4`) — the card's
 * own uniform rhythm between stacked children (heading → info list →
 * "Հետևիր մեզ" block, label → its list) and each list's own item spacing —
 * not the 40px `mt-10` before the label or the tighter `space-y-3` the
 * lists had. The "Հետևիր մեզ" label itself is the same 24px/700 style as
 * the card's own heading, not a small uppercase eyebrow.
 */
export async function ContactInfo() {
  const [{ general, social }, { messages }] = await Promise.all([
    getContacts(),
    getServerMessages(),
  ]);
  const t = messages.contact;
  const socialLinks = SOCIAL_LABELS.filter(({ key }) => social[key]);

  return (
    <div className="rounded-xl bg-white p-9 shadow-card">
      <h1 className="font-display text-home-card-title font-bold text-ink">{t.heading}</h1>

      <ul className="mt-4 space-y-4">
        {general.email && (
          <li>
            <a
              href={`mailto:${general.email}`}
              className="inline-flex min-h-11 items-center gap-2 text-lead text-ink/70 hover:text-accent"
            >
              <MailIcon />
              {general.email}
            </a>
          </li>
        )}
        {general.phones.map((phone) => (
          <li key={phone}>
            <a
              href={branchTelHref(phone)}
              className="inline-flex min-h-11 items-center gap-2 text-lead text-ink/70 hover:text-accent"
            >
              <PhoneIcon />
              {phone}
            </a>
          </li>
        ))}
        {general.workingHours && (
          <li className="inline-flex min-h-11 items-center gap-2 text-lead text-ink/70">
            <ClockIcon />
            {general.workingHours}
          </li>
        )}
      </ul>

      {socialLinks.length > 0 && (
        <div className="mt-4">
          <p className="font-display text-home-card-title font-bold text-ink">{t.info.followUs}</p>
          {/* Third pixel-audit pass (node `141:584`, verified via
              get_metadata): a single column, not a 2-column grid — each row
              is 28px tall with an 8px gap (36px row-to-row), and carries the
              same leading `ArrowUpRightIcon` every other social list on the
              site uses (Footer's own list, same icon/spacing convention). */}
          <ul className="mt-4 space-y-2">
            {socialLinks.map(({ key, name }) => (
              <li key={key}>
                <a
                  href={social[key]!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-lead text-ink/70 hover:text-accent"
                >
                  <ArrowUpRightIcon />
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 5.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m2.5 6 7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 3h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a1 1 0 0 1-1 1C9.5 17 3 10.5 3 4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
