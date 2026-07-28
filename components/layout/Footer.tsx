import Link from 'next/link';
import { BRANCHES } from '@/data/branches';
import { t } from '@/lib/i18n';
import { telHref } from '@/lib/utils';
import { LOGIN_ITEM, NAV_ITEMS, NAV_ITEMS_AFTER_LOGIN } from './nav';

/**
 * Footer — placeholder per spec (Homepage S11 is marked TBD). Wires the nav,
 * the branch data and click-to-call phones so nothing is retyped later; the
 * final layout, socials and legal lines land with the client's copy.
 */
export function Footer() {
  const links = [...NAV_ITEMS, LOGIN_ITEM, ...NAV_ITEMS_AFTER_LOGIN];

  return (
    <footer className="on-dark mt-auto bg-bg text-paper">
      <div className="container-page grid gap-12 py-section-sm lg:grid-cols-3 lg:py-section">
        <div>
          <Link href="/" className="font-display text-h3 font-extrabold uppercase tracking-tight">
            {t('common.brand')}
          </Link>
          <p className="mt-4 max-w-sm text-small text-muted">{t('home.subtitle')}</p>
        </div>

        <nav aria-label={t('footer.menuTitle')}>
          <h2 className="text-small font-semibold uppercase tracking-wide text-muted">
            {t('footer.menuTitle')}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-body transition-colors duration-micro hover:text-accent"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-small font-semibold uppercase tracking-wide text-muted">
            {t('footer.branchesTitle')}
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {BRANCHES.map((branch) => (
              <li key={branch.id} className="text-small">
                <p className="font-semibold">
                  {branch.city}, {branch.address}
                </p>
                <a
                  href={telHref(branch.phone)}
                  className="text-muted transition-colors duration-micro hover:text-accent"
                >
                  {branch.phone}
                </a>
                <span className="ml-2 text-muted">{branch.hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page py-6 text-caption text-muted">{t('footer.copyright')}</div>
      </div>
    </footer>
  );
}
