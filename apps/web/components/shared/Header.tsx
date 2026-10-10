'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useScrolled } from '@/lib/hooks/useScrolled';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { Messages } from '@/lib/i18n';
import type { BrandingLogos } from '@/lib/branding';

const NAV_LINKS: { key: keyof Messages['common']['nav']; href: string; chevron?: boolean }[] = [
  // Order and labels follow the design (Figma 436:2154): China, USA, Partners, About, Special offers, Contact.
  { key: 'china', href: '/china', chevron: true },
  { key: 'usa', href: '/usa' },
  { key: 'partners', href: '/partners' },
  { key: 'about', href: '/about' },
  { key: 'offers', href: '/offers' },
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
];

interface HeaderProps {
  /** Admin-managed branding logo, fetched server-side; `null`/absent until someone uploads one. */
  logo?: BrandingLogos | null;
}

export function Header({ logo = null }: HeaderProps = {}) {
  const nav = useMessages().common.nav;
  const scrolled = useScrolled();
  // Every other page opens on a dark hero photo, which is what the default
  // translucent-dark glass pill (`bg-bg/30`) is tuned for — verified against
  // Figma's homepage capture (node comment below). The partner portal has no
  // hero at all, just a plain light page from the very top, and Figma's own
  // "Dealers portal" mock (node 378:6118, file 9Lq4XpWusTJj1VnM6laAZr) draws
  // this exact same header as a solid white pill there instead — the dark
  // glass treatment read as a visibly wrong, unexplained dark bar floating
  // over a white page before this.
  const pathname = usePathname();
  // Light hero pages (About, Contact — Figma 436:2185/2390) and the portal draw the pill white.
  const isLightHeader =
    (pathname?.startsWith('/partners/portal') ?? false) ||
    pathname === '/about' ||
    pathname === '/contact';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, drawerOpen, () => setDrawerOpen(false));
  const { openUniversal } = useLeadWidgets();

  // Close the drawer automatically if the viewport grows past the mobile
  // breakpoint (kept in sync with the `xl:` classes below).
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)');
    const onChange = () => setDrawerOpen(false);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // The page behind a modal drawer must not scroll with it.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <header
      // Unscrolled top offset (`top-9` = 36px) matches the Header frame's
      // `absoluteBoundingBox.y` of 36 on the 1440-wide Figma page (node
      // `9321:6395`) — Figma only shows this top-of-page state; the
      // condensed `top-2` on scroll is this component's pre-existing,
      // unverified-by-Figma judgment call, kept as-is.
      className={`fixed inset-x-0 z-30 px-4 transition-[top] duration-standard ease-expo sm:px-6 ${scrolled ? 'top-2' : 'top-9'}`}
    >
      <div
        // Horizontal padding (`px-6` = 24px at `sm:`) and vertical padding
        // (`py-4` = 16px at `lg:`, matching a 48px BTN centered in the
        // frame's 80px height) are read off node `9321:6395`'s own edge
        // insets. Fill opacity: Figma's single captured state is `bg-bg/30`
        // (rgb(13,13,13) @ 30%); the higher `bg-bg/80` on scroll is this
        // component's pre-existing judgment call for legibility over
        // arbitrary scrolled-past content, now anchored to the correct
        // unscrolled baseline.
        className={`relative mx-auto flex max-w-header items-center justify-between gap-2 rounded-pill px-4 py-2 shadow-card transition-colors duration-standard sm:gap-4 sm:px-6 lg:py-4 ${
          isLightHeader
            ? 'border border-line-light bg-white'
            : `border border-white/10 backdrop-blur-lg ${scrolled ? 'bg-bg/80' : 'bg-bg/30'}`
        }`}
      >
        <Link href="/" aria-label={nav.home} className="flex min-h-11 items-center gap-2 pl-0.5">
          {/*
            Box aspect ratio (96×36 ≈ 2.67:1) matches the logo mark's own
            bounding box in Figma (121×46 ≈ 2.63:1, node `9321:6404`) closely
            enough that `object-contain` won't noticeably letterbox an
            admin-uploaded logo of similar proportions.
          */}
          <BrandLogo
            logo={logo}
            className={
              isLightHeader ? 'h-[36.56px] w-[96px]' : 'h-[36px] w-[96px] sm:h-[46px] sm:w-[121px]'
            }
            sizes="121px"
            tone={isLightHeader ? 'light' : 'dark'}
          />
        </Link>

        {/*
          Text style (16px/regular/white) and 24px item spacing match Figma's
          nav frame (`9321:6396`, "Menu item" component `9201:11274`) — but
          that frame draws only 6 top-level items, each with a chevron-down
          implying a dropdown that groups sub-items (per figma-bridge's
          earlier note). This component intentionally uses the skill's
          flat link contract instead (no dropdown behavior built; Blog and
          the portal Login link were both removed once they turned out to
          have nothing behind them for a typical visitor — see their
          removal commits), which is measurably wider
          than what Figma's 6-item design was spaced for — flat items at
          24px gaps/16px text does not fit
          within `max-w-header` even at the full 1440px design width
          (verified by rendering at fixed widths, not guessed). Tightened
          gap and reduced to `text-small` to make the flat-list contract
          actually fit; `whitespace-nowrap` prevents the alternative failure
          mode (a multi-word label wrapping mid-item) if it's ever still
          tight. Revisit sizing if/when dropdown grouping is built to match
          Figma's real item count.
        */}
        <nav
          aria-label={nav.primaryNav}
          className="hidden items-center gap-0.5 xl:flex min-[1400px]:absolute min-[1400px]:left-[calc(50%+0.5px)] min-[1400px]:top-1/2 min-[1400px]:-translate-x-1/2 min-[1400px]:-translate-y-1/2 min-[1400px]:gap-1.5"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap px-2 py-1 text-[14px] leading-6 transition-colors duration-micro hover:text-accent ${pathname === item.href ? 'font-bold' : 'font-normal'} ${isLightHeader ? 'text-ink' : 'text-white'}`}
            >
              {nav[item.key]}
              {item.chevron && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M4.67 6.33 8 9.67l3.33-3.34"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {/* Dealers have their own door: the portal, kept apart from the page links. */}
          <Link
            href="/partners/portal"
            aria-label={nav.partnerPortal}
            title={nav.partnerPortal}
            aria-current={pathname?.startsWith('/partners/portal') ? 'page' : undefined}
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-pill border transition-colors duration-standard ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isLightHeader
                ? 'border-ink/20 text-ink hover:bg-neutral-50'
                : 'border-white/40 text-white hover:bg-white/10'
            }`}
          >
            <PortalGlyph />
          </Link>
          <button
            type="button"
            onClick={() => openUniversal({ sourceCta: 'header-cta' })}
            className="inline-flex h-12 shrink-0 items-center gap-1 rounded-pill bg-accent px-6 text-small font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {nav.headerCta}
            <ArrowGlyph />
          </button>
        </div>

        {/* Quick request on phones/tablets; below 360px it lives in the menu only. */}
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'header-cta' })}
          className="ml-auto hidden h-11 shrink-0 items-center rounded-pill bg-accent px-4 text-[14px] font-normal leading-5 text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-[360px]:inline-flex xl:hidden"
        >
          {nav.headerCta}
        </button>

        <button
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-pill xl:hidden ${isLightHeader ? 'text-ink' : 'text-white'}`}
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
        <div className="fixed inset-0 z-40 xl:hidden">
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
            aria-label={nav.primaryNav}
            tabIndex={-1}
            // Leaves a strip of backdrop on any phone so a tap outside still closes it.
            className="absolute right-0 top-0 flex h-full w-[min(320px,calc(100%-56px))] flex-col gap-1 overflow-y-auto overscroll-contain bg-surface p-6 pt-20 outline-none"
          >
            <button
              type="button"
              aria-label={nav.menuClose}
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-pill text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M2 2l14 14M16 2L2 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {[{ key: 'home' as const, href: '/' }, ...NAV_LINKS].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`min-h-11 rounded-md px-2 py-3 text-lead hover:bg-white/5 ${
                  pathname === item.href ? 'font-bold text-white' : 'font-medium text-white/90'
                }`}
              >
                {nav[item.key]}
              </Link>
            ))}
            <Link
              href="/partners/portal"
              onClick={() => setDrawerOpen(false)}
              className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-white/40 px-6 text-small text-white hover:bg-white/10"
            >
              <PortalGlyph />
              {nav.partnerPortal}
            </Link>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                openUniversal({ sourceCta: 'header-cta' });
              }}
              className="mt-3 inline-flex h-12 items-center justify-center gap-1 rounded-pill bg-accent px-6 text-small font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
            >
              {nav.headerCta}
              <ArrowGlyph />
            </button>
            <LanguageSwitcher className="mt-4 w-fit" />
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Header CTA's trailing icon — verified against the live `BTN` instance,
 * Figma node `9321:6403` (`Property 1=Default, Type=Primary`, component set
 * `9259:8139`). Its icon slot (`I9321:6403;9259:8131`) is an instance of
 * `Iconly/Light-outline/Arrow - Up` (componentId `6203:241`) rotated 45°
 * (`rotation: 0.7853981633974483` rad) — turning the base up-arrow glyph
 * into an up-right "go" arrow. That's exactly the diagonal-arrow shape
 * already drawn by hand elsewhere in this codebase (`DirectionCard.tsx`,
 * `MiniCarCard.tsx`, `Footer.tsx`, `FooterCta.tsx`), all of which reference
 * this same rotated Iconly instance (36 occurrences of
 * `Iconly/Light-outline/Arrow - Up` across the Homepage frame, every one
 * rotated 45°) — so the glyph itself was already correct; nothing to swap.
 *
 * Two things *were* wrong and are fixed here:
 * - Position: the real instance is icon-*after*-label (text left, icon
 *   right — `I9321:6403;9259:8130` "Get Started" ends 4px, matching
 *   `itemSpacing: 4`, before the icon starts), not leading. This matches
 *   `FooterCta.tsx`'s `{label}<ArrowGlyph />` order.
 * - Size: the icon instance's own (unrotated) bounding box is 20×20
 *   (rotated bbox 28.28 / √2), not 16×16 — `Footer.tsx`'s `ArrowGlyph`
 *   already defaults to `size=20` for this reason.
 */
function ArrowGlyph() {
  return (
    <svg
      width="20"
      height="20"
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

/** A small "account" glyph for the portal entry. */
function PortalGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 15.5c.8-2.6 3-4 6-4s5.2 1.4 6 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
