'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { LOGIN_ITEM, NAV_ITEMS, NAV_ITEMS_AFTER_LOGIN, type NavItem } from './nav';

/** Sticky global nav; condenses on scroll, hamburger drawer below `lg`. */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on navigation. Adjusting state during render (rather than
  // in an effect) means the drawer never paints once on the new route before
  // closing — and it covers back/forward, which a link `onClick` would not.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const allItems: NavItem[] = [...NAV_ITEMS, LOGIN_ITEM, ...NAV_ITEMS_AFTER_LOGIN];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-paper/90 backdrop-blur transition-all duration-standard ease-expo',
        scrolled ? 'border-line-light shadow-card' : 'border-transparent',
      )}
    >
      <div
        className={cn(
          'container-page flex items-center justify-between gap-6 transition-all duration-standard ease-expo',
          scrolled ? 'h-14' : 'h-[var(--header-height)]',
        )}
      >
        <Link
          href="/"
          aria-label={t('nav.home')}
          className="font-display text-lead font-extrabold uppercase tracking-tight"
        >
          {t('common.brand')}
        </Link>

        <nav aria-label={t('nav.home')} className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
          <Link
            href={LOGIN_ITEM.href}
            className={cn(
              'rounded-pill border border-ink px-4 py-1.5 text-small font-semibold transition-colors duration-micro hover:bg-ink hover:text-paper',
              pathname.startsWith(LOGIN_ITEM.href) && 'bg-ink text-paper',
            )}
          >
            {t(LOGIN_ITEM.labelKey)}
          </Link>
          {NAV_ITEMS_AFTER_LOGIN.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? t('common.a11y.closeMenu') : t('common.a11y.openMenu')}
          className="flex h-10 w-10 items-center justify-center rounded-pill border border-line-light lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            {menuOpen ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="container-page border-t border-line-light bg-paper pb-8 pt-4 lg:hidden"
      >
        <nav aria-label={t('nav.home')} className="flex flex-col">
          {allItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'border-b border-line-light py-4 text-lead font-semibold',
                pathname.startsWith(item.href) ? 'text-accent' : 'text-ink',
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-small font-medium transition-colors duration-micro hover:text-accent',
        active ? 'text-accent' : 'text-ink',
      )}
    >
      {t(item.labelKey)}
    </Link>
  );
}
