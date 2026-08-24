'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useScrolled } from '@/lib/hooks/useScrolled';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { messages } from '@/lib/messages';

const nav = messages.common.nav;
const brand = messages.common.brand;

const NAV_LINKS: { key: keyof typeof nav; href: string }[] = [
  { key: 'china', href: '/china' },
  { key: 'usa', href: '/usa' },
  { key: 'offers', href: '/offers' },
  { key: 'partners', href: '/partners' },
  { key: 'blog', href: '/blog' },
  { key: 'login', href: '/partners/portal' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
];

export function Header() {
  const scrolled = useScrolled();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, drawerOpen, () => setDrawerOpen(false));

  // Close the drawer automatically if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setDrawerOpen(false);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur transition-[padding] duration-standard ease-expo ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={nav.home}
          className="font-display text-lead font-bold tracking-tight text-white"
        >
          {brand}
        </Link>

        <nav aria-label={nav.primaryNav} className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-small font-medium text-white/80 transition-colors duration-micro hover:text-white"
            >
              {nav[item.key]}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-white lg:hidden"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          aria-label={drawerOpen ? nav.menuClose : nav.menuOpen}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
            <path d="M0 1h22M0 8h22M0 15h22" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={nav.menuClose}
            className="absolute inset-0 bg-bg/80"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id={drawerId}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={nav.menuOpen}
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col gap-1 bg-surface p-6 pt-20 outline-none"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className="min-h-11 rounded-md px-2 py-3 text-lead font-medium text-white/90 hover:bg-white/5"
              >
                {nav[item.key]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
