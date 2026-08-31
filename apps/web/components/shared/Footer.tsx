import Link from 'next/link';
import { branchTelHref } from '@/lib/data/branches';
import { getServerMessages } from '@/lib/i18n';
import type { Messages } from '@/lib/i18n';
import { FooterCta } from '@/components/shared/FooterCta';
import { BrandLogo } from '@/components/shared/BrandLogo';
import type { BrandingLogos } from '@/lib/branding';
import type { GeneralContacts, SocialLinks } from '@/lib/contacts';

const FOOTER_LINKS: { key: keyof Messages['common']['nav']; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'china', href: '/china' },
  { key: 'usa', href: '/usa' },
  { key: 'offers', href: '/offers' },
  { key: 'partners', href: '/partners' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
];

// Figma's Homepage footer (node `9321:6288`) only shows socials + contact +
// a big "let's talk" CTA — no nav/branch columns, matching an agency-template
// footer rather than AutoRoom-authored content. Site nav + branch addresses
// are still surfaced below (smaller, secondary) since Footer is global and
// every other page needs that wayfinding; see report for the full rationale.
//
// Labels only, deliberately — hrefs come from admin-managed `contacts.social`
// (see `SocialList` below), which only has these four platforms. No
// Pinterest/Youtube field exists on the backend, so they're not listed here
// rather than shipped as permanently-dead '#' links.
const SOCIAL_LABELS: { key: keyof SocialLinks; name: string }[] = [
  { key: 'instagram', name: 'Instagram' },
  { key: 'facebook', name: 'Facebook' },
  { key: 'tiktok', name: 'TikTok' },
  { key: 'linkedin', name: 'Linkedin' },
];

interface FooterProps {
  /** Same admin-managed branding logo `layout.tsx` passes to `Header`; falls back to the bundled mark until one is uploaded. */
  logo?: BrandingLogos | null;
  /** Admin-managed general contact info/socials; a field renders nothing (not a placeholder) until an admin fills it in. */
  contacts?: { general: GeneralContacts; social: SocialLinks };
}

const NO_CONTACTS: GeneralContacts = { email: null, phones: [] };
const NO_SOCIAL: SocialLinks = { facebook: null, instagram: null, tiktok: null, linkedin: null };

export async function Footer({
  logo = null,
  contacts = { general: NO_CONTACTS, social: NO_SOCIAL },
}: FooterProps = {}) {
  const { messages } = await getServerMessages();
  const nav = messages.common.nav;
  const footer = messages.common.footer;
  const { general, social } = contacts;
  const email = general.email;
  const phone = general.phones[0] ?? null;
  const socialLinks = SOCIAL_LABELS.filter(({ key }) => social[key]);
  return (
    <footer className="bg-bg text-white">
      <div className="mx-auto max-w-container px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
        <div className="flex flex-col justify-between gap-12 sm:flex-row sm:items-start">
          <Link href="/" aria-label={nav.home} className="inline-block">
            {/* Box aspect ratio matches the logo mark's real bounding box
                (121×46 ≈ 2.63:1, Figma node 9321:6404 / footer instance
                2001:1772) scaled up for the footer's larger presence. */}
            <BrandLogo logo={logo} className="h-12 w-[126px]" sizes="126px" />
            <p className="mt-2 font-display text-h2 font-extrabold uppercase leading-none tracking-tight text-white">
              {messages.common.brand}
            </p>
            <p className="mt-1 text-caption uppercase tracking-[0.3em] text-white/50">
              Auto Import Company
            </p>
          </Link>

          <div className="flex flex-col gap-1">
            <p className="font-display text-home-h2 font-light text-white">{footer.ctaHeading}</p>
            <FooterCta label={footer.ctaButton} />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {socialLinks.length > 0 && (
            <div>
              <p className="text-small font-semibold uppercase tracking-wide text-white/50">
                {footer.socialHeading}
              </p>
              <ul className="mt-4 space-y-3">
                {socialLinks.map(({ key, name }) => (
                  <li key={key}>
                    <a
                      href={social[key]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                    >
                      <ArrowGlyph size={14} />
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(email || phone) && (
            <div>
              <p className="text-small font-semibold uppercase tracking-wide text-white/50">
                {footer.contactHeading}
              </p>
              <ul className="mt-4 space-y-3">
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                    >
                      <ArrowGlyph size={14} />
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a
                      href={branchTelHref(phone)}
                      className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                    >
                      <ArrowGlyph size={14} />
                      {phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div>
            <p className="text-small font-semibold uppercase tracking-wide text-white/50">
              {footer.navHeading}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block min-h-11 py-2.5 text-small text-white/80 hover:text-accent"
                  >
                    {nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-container flex-col gap-2 px-4 py-6 text-caption text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            {footer.rights.includes('©')
              ? footer.rights
              : `© ${new Date().getFullYear()} Autoroom — ${footer.rights}`}
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              {footer.cookiePolicy}
            </a>
            <a href="#" className="hover:text-white">
              {footer.privacyPolicy}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ArrowGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4 12 12 4M12 4H5M12 4v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
