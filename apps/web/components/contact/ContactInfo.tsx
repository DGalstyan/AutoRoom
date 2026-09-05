import { getContacts } from '@/lib/contacts';
import { branchTelHref } from '@/lib/data/branches';
import { getServerMessages } from '@/lib/i18n';

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
 */
export async function ContactInfo() {
  const [{ general, social }, { messages }] = await Promise.all([getContacts(), getServerMessages()]);
  const t = messages.contact;
  const socialLinks = SOCIAL_LABELS.filter(({ key }) => social[key]);

  return (
    <div>
      <h1 className="font-display text-home-h2 font-light text-ink">{t.heading}</h1>

      <ul className="mt-8 space-y-3">
        {general.email && (
          <li>
            <a
              href={`mailto:${general.email}`}
              className="inline-flex min-h-11 items-center gap-2 text-body text-ink hover:text-accent"
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
              className="inline-flex min-h-11 items-center gap-2 text-body text-ink hover:text-accent"
            >
              <PhoneIcon />
              {phone}
            </a>
          </li>
        ))}
        {general.workingHours && (
          <li className="inline-flex min-h-11 items-center gap-2 text-body text-ink">
            <ClockIcon />
            {general.workingHours}
          </li>
        )}
      </ul>

      {socialLinks.length > 0 && (
        <div className="mt-10">
          <p className="text-small font-semibold uppercase tracking-wide text-ink/50">{t.info.followUs}</p>
          <ul className="mt-4 space-y-3">
            {socialLinks.map(({ key, name }) => (
              <li key={key}>
                <a
                  href={social[key]!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-body text-ink hover:text-accent"
                >
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
