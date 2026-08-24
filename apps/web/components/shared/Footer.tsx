import Link from 'next/link';
import { BRANCHES, branchTelHref } from '@/lib/data/branches';
import { messages } from '@/lib/messages';

const nav = messages.common.nav;
const footer = messages.common.footer;
const brand = messages.common.brand;

const FOOTER_LINKS: { key: keyof typeof nav; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'china', href: '/china' },
  { key: 'usa', href: '/usa' },
  { key: 'offers', href: '/offers' },
  { key: 'partners', href: '/partners' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
];

const SOCIALS = [
  { name: 'Facebook', href: '#' },
  { name: 'Instagram', href: '#' },
  { name: 'TikTok', href: '#' },
  { name: 'LinkedIn', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg text-white/80">
      <div className="mx-auto grid max-w-container grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lead font-bold text-white">{brand}</p>
          <p className="mt-3 max-w-xs text-small text-white/60">{footer.tagline}</p>
        </div>

        <div>
          <p className="text-small font-semibold uppercase tracking-wide text-white/50">
            {footer.navHeading}
          </p>
          <ul className="mt-4 space-y-2">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-small hover:text-white">
                  {nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-small font-semibold uppercase tracking-wide text-white/50">
            {footer.branchesHeading}
          </p>
          <ul className="mt-4 space-y-4">
            {BRANCHES.map((branch) => (
              <li key={branch.id} className="text-small">
                <p className="font-medium text-white">
                  {branch.name} — {branch.city}
                </p>
                <p className="text-white/60">{branch.address}</p>
                <a href={branchTelHref(branch.phone)} className="text-white/60 hover:text-white">
                  {branch.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-small font-semibold uppercase tracking-wide text-white/50">
            {footer.socialHeading}
          </p>
          <ul className="mt-4 flex gap-3">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  aria-label={social.name}
                  className="flex h-11 w-11 items-center justify-center rounded-pill border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                >
                  <SocialGlyph name={social.name} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-6">
        <p className="mx-auto max-w-container px-4 text-caption text-white/40 sm:px-6">
          © {new Date().getFullYear()} {brand}. {footer.rights}
        </p>
      </div>
    </footer>
  );
}

function SocialGlyph({ name }: { name: string }) {
  // TODO(design-system): swap for real brand glyphs once icon assets land.
  return (
    <span aria-hidden="true" className="text-caption font-semibold">
      {name.slice(0, 2)}
    </span>
  );
}
