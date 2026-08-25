import Link from 'next/link';
import { BRANCHES, branchTelHref } from '@/lib/data/branches';
import { messages } from '@/lib/messages';
import { FooterCta } from '@/components/shared/FooterCta';

const nav = messages.common.nav;
const footer = messages.common.footer;

const FOOTER_LINKS: { key: keyof typeof nav; href: string }[] = [
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
const SOCIALS = [
  { name: 'Instagram', href: '#' },
  { name: 'Pinterest', href: '#' },
  { name: 'Facebook', href: '#' },
  { name: 'Youtube', href: '#' },
  { name: 'Linkedin', href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-bg text-white">
      <div className="mx-auto max-w-container px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
        <div className="flex flex-col justify-between gap-12 sm:flex-row sm:items-start">
          <Link href="/" aria-label={nav.home} className="inline-block">
            {/* TODO(design-system): swap for the real AutoRoom wordmark/car-outline
                SVG (Figma node 9321:6290) once it can be exported — a text lockup
                approximates the logo's proportions in the meantime. */}
            <CarGlyph />
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
          <div>
            <p className="text-small font-semibold uppercase tracking-wide text-white/50">
              {footer.socialHeading}
            </p>
            <ul className="mt-4 space-y-3">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                  >
                    <ArrowGlyph size={14} />
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-small font-semibold uppercase tracking-wide text-white/50">
              {footer.contactHeading}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:hello@autoroom.co"
                  className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                >
                  <ArrowGlyph size={14} />
                  hello@autoroom.co
                </a>
              </li>
              <li>
                <a
                  href={branchTelHref(BRANCHES[0].phone)}
                  className="inline-flex min-h-11 items-center gap-2 text-small text-white/80 hover:text-accent"
                >
                  <ArrowGlyph size={14} />
                  {BRANCHES[0].phone}
                </a>
              </li>
            </ul>
          </div>

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

function CarGlyph() {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none" aria-hidden="true">
      <path
        d="M4 22l4-9a4 4 0 0 1 3.6-2.2h33a4 4 0 0 1 3.7 2.5L52 22"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M2 22h68M8 18h56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="46" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
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
