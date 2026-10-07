import Link from 'next/link';
import { branchTelHref, getBranches } from '@/lib/branches';
import { getServerMessages } from '@/lib/i18n';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { FooterLanguages } from '@/components/shared/FooterLanguages';
import { SocialDisc, type SocialKey } from '@/components/shared/SocialIcons';
import type { BrandingLogos } from '@/lib/branding';
import type { GeneralContacts, MessengerLinks, SocialLinks } from '@/lib/contacts';

/**
 * Site footer — Figma 436:2045 (1440×542, `#0d0d0d`, 64px/56px padding): two
 * 560px blocks. Left: the logo, and at the bottom the social discs (two columns,
 * bottom-aligned) beside the copyright. Right: the nav row at the top, and at
 * the bottom "Contact Us", "Locations" and "Languages".
 *
 * The design's text there is template placeholder copy ("Saryan street 1…",
 * "hello@autoroom.co"), so everything real is data: contacts and social links
 * are admin settings, the addresses come from the admin-managed branches, and
 * the nav labels/hrefs are the site's own navigation. A field with no data
 * renders nothing rather than a placeholder.
 */
const SOCIALS: { key: keyof SocialLinks; icon: SocialKey; label: string }[] = [
  { key: 'facebook', icon: 'facebook', label: 'Facebook' },
  { key: 'tiktok', icon: 'tiktok', label: 'TikTok' },
  { key: 'instagram', icon: 'instagram', label: 'Instagram' },
  { key: 'linkedin', icon: 'linkedin', label: 'LinkedIn' },
];
const MESSENGERS: { key: keyof MessengerLinks; icon: SocialKey; label: string }[] = [
  { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', icon: 'telegram', label: 'Telegram' },
  { key: 'viber', icon: 'viber', label: 'Viber' },
];

const NAV = [
  { key: 'china', href: '/china' },
  { key: 'usa', href: '/usa' },
  { key: 'partners', href: '/partners' },
  { key: 'about', href: '/about' },
  { key: 'offers', href: '/offers' },
] as const;

interface FooterProps {
  /** Same admin-managed branding logo `layout.tsx` passes to `Header`; falls back to the bundled mark until one is uploaded. */
  logo?: BrandingLogos | null;
  /** Admin-managed general contact info/socials/messengers; a field renders nothing (not a placeholder) until an admin fills it in. */
  contacts?: { general: GeneralContacts; social: SocialLinks; messengers?: MessengerLinks };
}

const NO_CONTACTS: GeneralContacts = { email: null, phones: [], workingHours: null };
const NO_SOCIAL: SocialLinks = { facebook: null, instagram: null, tiktok: null, linkedin: null };
const NO_MESSENGERS: MessengerLinks = { whatsapp: null, viber: null, telegram: null };

export async function Footer({
  logo = null,
  contacts = { general: NO_CONTACTS, social: NO_SOCIAL },
}: FooterProps = {}) {
  const [{ messages }, branches] = await Promise.all([getServerMessages(), getBranches()]);
  const nav = messages.common.nav;
  const footer = messages.common.footer;
  const { general, social } = contacts;
  const messengers = contacts.messengers ?? NO_MESSENGERS;

  const socialLinks = [
    ...SOCIALS.filter(({ key }) => social[key]).map((s) => ({ ...s, href: social[s.key]! })),
    ...MESSENGERS.filter(({ key }) => messengers[key]).map((m) => ({
      ...m,
      href: messengers[m.key]!,
    })),
  ];
  const phones = general.phones;
  const email = general.email;
  const year = new Date().getFullYear();

  const legal = (
    <div className="text-[12px] leading-[1.4] text-[#8f9fa3]">
      <p>{footer.rights.includes('©') ? footer.rights : `© ${year} AutoRoom — ${footer.rights}`}</p>
      <p className="mt-1 flex flex-wrap gap-x-4">
        <Link href="/privacy" className="inline-flex min-h-6 items-center hover:text-white">
          {footer.privacyPolicy}
        </Link>
        <Link href="/terms" className="inline-flex min-h-6 items-center hover:text-white">
          {footer.terms}
        </Link>
      </p>
    </div>
  );

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-page flex-col justify-between gap-14 px-4 py-12 sm:px-6 lg:min-h-[542px] lg:flex-row lg:px-16 lg:py-14">
        {/* Left block */}
        <div className="flex flex-col justify-between gap-12 lg:w-[calc(50%-24px)] lg:max-w-[560px] lg:gap-[192px]">
          <Link href="/" aria-label={nav.home} className="inline-block">
            <BrandLogo
              logo={logo}
              className="h-[64px] w-[168px] lg:h-[98px] lg:w-[257px]"
              sizes="257px"
            />
          </Link>

          <div className="flex items-end justify-between gap-6">
            {socialLinks.length > 0 && (
              <ul className="flex max-w-[110px] flex-wrap-reverse content-end items-end gap-[10px] sm:max-w-[120px]">
                {socialLinks.map(({ key, icon, label, href }) => (
                  <li key={key} className="flex h-11 w-11 items-center justify-center">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="block rounded-full transition-transform duration-standard ease-expo hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <SocialDisc name={icon} />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Desktop: beside the socials, as in the design. */}
            <div className="ml-auto hidden lg:block">{legal}</div>
          </div>
        </div>

        {/* Right block */}
        <div className="flex flex-col justify-between gap-12 lg:w-[calc(50%-24px)] lg:max-w-[600px] lg:gap-0">
          <nav aria-label={nav.primaryNav}>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[16px] leading-6 text-[#8f9fa3] lg:gap-x-8 min-[1400px]:flex-nowrap min-[1400px]:gap-x-[41px]">
              {NAV.map(({ key, href }) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center hover:text-white">
                    {nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-end lg:w-full">
            <div className="flex flex-col gap-12">
              {(phones.length > 0 || email) && (
                <div className="flex flex-col gap-4">
                  <p className="text-[20px] font-medium leading-[1.1] tracking-[-0.2px] text-white">
                    {footer.contactHeading}
                  </p>
                  <ul className="flex flex-col text-[14px] font-medium leading-[18px] text-[#8f9fa3]">
                    {phones.map((phone) => (
                      <li key={phone}>
                        <a
                          href={branchTelHref(phone)}
                          className="inline-flex min-h-6 items-center hover:text-white"
                        >
                          {phone}
                        </a>
                      </li>
                    ))}
                    {email && (
                      <li>
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex min-h-6 items-center hover:text-white"
                        >
                          {email}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {branches.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-[20px] font-medium leading-[1.1] tracking-[-0.2px] text-white">
                    {footer.branchesHeading}
                  </p>
                  <ul className="flex flex-col gap-[3px] text-[14px] font-medium leading-[18px] text-[#8f9fa3]">
                    {branches.map((branch) => (
                      <li key={branch.id}>
                        {branch.city ? `${branch.city}, ` : ''}
                        {branch.address}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <FooterLanguages heading={footer.languagesHeading} />
          </div>
        </div>
      </div>

      {/* Phones/tablets: the copyright closes the footer rather than sitting mid-way. */}
      <div className="mx-auto max-w-page border-t border-white/10 px-4 py-6 sm:px-6 lg:hidden">
        {legal}
      </div>
    </footer>
  );
}
