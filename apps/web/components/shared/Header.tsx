'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useScrolled } from '@/lib/hooks/useScrolled';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { messages } from '@/lib/messages';
import type { BrandingLogos } from '@/lib/branding';

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

interface HeaderProps {
  /** Admin-managed branding logo, fetched server-side; `null`/absent until someone uploads one. */
  logo?: BrandingLogos | null;
}

export function Header({ logo = null }: HeaderProps = {}) {
  const scrolled = useScrolled();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, drawerOpen, () => setDrawerOpen(false));
  const { openUniversal } = useLeadWidgets();

  // Confirmed against Figma node `9321:6395` (Header) → `9321:6404`
  // (`logo_vector 1`): the header sits on a dark, translucent glass pill
  // (fill rgb(13,13,13) @ 30% opacity) and every vector in the placeholder
  // logo mark has `fills: [{ r:1, g:1, b:1 }]` — i.e. the mockup logo is pure
  // white. So the *light-on-dark* logo variant — `logoLightUrl`, despite the
  // field name being easy to misread as "logo for light mode" — is correct
  // in both the expanded and scrolled/condensed states. Falls back to
  // whichever single variant an admin has actually uploaded.
  const logoSrc = logo?.logoLightUrl ?? logo?.logoDarkUrl ?? null;

  // Close the drawer automatically if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setDrawerOpen(false);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

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
        className={`mx-auto flex max-w-header items-center justify-between gap-4 rounded-pill border border-white/10 bg-bg/30 px-4 py-2 shadow-card backdrop-blur-lg transition-colors duration-standard sm:px-6 lg:py-4 ${
          scrolled ? 'bg-bg/80' : ''
        }`}
      >
        <Link href="/" aria-label={nav.home} className="flex items-center gap-2 pl-2">
          {logoSrc ? (
            // Fixed-size box so an unknown-aspect-ratio uploaded logo never
            // causes layout shift; `unoptimized` because the admin-uploaded
            // URL's host isn't known at build time (see `apps/api`'s local
            // disk upload storage), so it can't be added to
            // `images.remotePatterns` ahead of time.
            // Box aspect ratio (96×36 ≈ 2.67:1) matches the placeholder logo
            // mark's own bounding box in Figma (121×46 ≈ 2.63:1, node
            // `9321:6404`) closely enough that `object-contain` won't
            // noticeably letterbox a real uploaded logo of similar proportions.
            <span className="relative block h-9 w-24">
              <Image
                src={logoSrc}
                alt={brand}
                fill
                sizes="96px"
                unoptimized
                className="object-contain object-left"
              />
            </span>
          ) : (
            <span className="font-display text-lead font-bold uppercase tracking-tight text-white">
              {brand}
            </span>
          )}
        </Link>

        {/*
          Item gap (`gap-6` = 24px) matches `itemSpacing: 24` on Figma's nav
          frame (`9321:6396`). Text style — 16px/regular/white at full
          opacity — is read from that frame's own "Menu item" text override
          (`I9321:6397;6357:2047`: fontSize 16, fontWeight 400, fill
          rgb(255,255,255) @ 100%, componentId `9201:11274` = the "Menu
          item" component set's `State=Default` variant). Figma's Default
          variant is already full-opacity white, so `hover:text-accent`
          (rather than a no-op white→white) is this component's judgment
          call for a visible hover state — the sibling `State=Hover` variant
          (`9201:11277`) wasn't fetched.
        */}
        <nav aria-label={nav.primaryNav} className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-body font-normal text-white transition-colors duration-micro hover:text-accent"
            >
              {nav[item.key]}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'header-cta' })}
          className="hidden h-12 shrink-0 items-center gap-1 rounded-pill bg-accent px-6 text-small font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:inline-flex"
        >
          {nav.headerCta}
          <ArrowGlyph />
        </button>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-pill text-white lg:hidden"
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
