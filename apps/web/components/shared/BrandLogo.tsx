'use client';

import Image from 'next/image';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { BrandingLogos } from '@/lib/branding';

// The real AutoRoom logo mark, exported from Figma (node `9321:6404`
// `logo_vector 1` / the footer's larger `2001:1772` "Layer_x0020_1" instance —
// same vector, same `fill: white`, just scaled up 2.505x for the footer) and
// committed here as a permanent, production-safe asset — plus a recolored
// `#0D0D0D` (`ink`) variant for light surfaces (the partner portal's white
// header; see `Header.tsx`'s `isLightHeader`), since `logoLightUrl`
// (white artwork) reads invisible on a white pill. These are the fallbacks
// used until an admin uploads a real replacement of each through the CMS.
const DEFAULT_LOGO_SRC = '/brand/logo-mark.svg';
const DEFAULT_LOGO_DARK_SRC = '/brand/logo-mark-dark.svg';

interface BrandLogoProps {
  /** Admin-managed branding logo, fetched server-side; falls back to the bundled default(s) until one is uploaded. */
  logo?: BrandingLogos | null;
  /** Box size, e.g. `"h-9 w-24"`. Fixed so an unknown-aspect-ratio uploaded logo never shifts layout. */
  className?: string;
  /** `sizes` hint passed through to `next/image`; should match the box's rendered width. */
  sizes?: string;
  /**
   * Which surface this renders on: `'dark'` (default) for the usual dark
   * hero/glass-header/footer surfaces, where the white `logoLightUrl`
   * artwork reads correctly; `'light'` for a plain white/light surface
   * (the portal's white header), which needs the dark-ink `logoDarkUrl`
   * artwork instead — the field names are the *color of the artwork*, not
   * the surface it's drawn on, easy to misread as the opposite.
   */
  tone?: 'dark' | 'light';
}

/**
 * Single source of truth for "which logo image to render," now surface-aware:
 * `tone='dark'` (the default — matches every pre-existing call site) reads
 * `logoLightUrl` (white artwork, for dark surfaces); `tone='light'` reads
 * `logoDarkUrl` (dark-ink artwork, for light surfaces).
 *
 * A client component (not a Server Component reading `getServerMessages()`
 * directly) because `Header.tsx` — a client component — renders it inline;
 * a Client Component may only import Server Components that are handed to it
 * via composition (`children`/props from a Server ancestor), never imported
 * and instantiated directly.
 */
export function BrandLogo({
  logo = null,
  className = 'h-9 w-24',
  sizes = '96px',
  tone = 'dark',
}: BrandLogoProps) {
  const brand = useMessages().common.brand;
  const logoSrc =
    tone === 'light'
      ? (logo?.logoDarkUrl ?? DEFAULT_LOGO_DARK_SRC)
      : (logo?.logoLightUrl ?? DEFAULT_LOGO_SRC);

  return (
    <span className={`relative block ${className}`}>
      <Image
        src={logoSrc}
        alt={brand}
        fill
        sizes={sizes}
        // The admin-upload host isn't known at build time (see
        // `apps/api`'s local disk upload storage), so it can't be added to
        // `images.remotePatterns` ahead of time; kept unconditional so the
        // bundled default and an uploaded replacement behave identically.
        unoptimized
        className="object-contain object-left"
      />
    </span>
  );
}
