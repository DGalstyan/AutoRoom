import Image from 'next/image';
import { messages } from '@/lib/messages';
import type { BrandingLogos } from '@/lib/branding';

const brand = messages.common.brand;

// The real AutoRoom logo mark, exported from Figma (node `9321:6404`
// `logo_vector 1` / the footer's larger `2001:1772` "Layer_x0020_1" instance —
// same vector, same `fill: white`, just scaled up 2.505x for the footer) and
// committed here as a permanent, production-safe asset. `getBrandingLogos`'s
// own doc comment confirms nobody has uploaded a custom logo in production
// yet (`logoLightUrl`/`logoDarkUrl` are both `null`), so without this default
// the site would ship logo-less — a plain text wordmark in the Header, a
// hand-drawn placeholder glyph in the Footer. This file is the fallback used
// until an admin uploads a real replacement through the CMS.
const DEFAULT_LOGO_SRC = '/brand/logo-mark.svg';

interface BrandLogoProps {
  /** Admin-managed branding logo, fetched server-side; falls back to `DEFAULT_LOGO_SRC` until one is uploaded. */
  logo?: BrandingLogos | null;
  /** Box size, e.g. `"h-9 w-24"`. Fixed so an unknown-aspect-ratio uploaded logo never shifts layout. */
  className?: string;
  /** `sizes` hint passed through to `next/image`; should match the box's rendered width. */
  sizes?: string;
}

/**
 * Single source of truth for "which logo image to render." Both the fallback
 * mark and every admin-uploaded logo are drawn as plain white artwork, so
 * this is safe on any of the dark surfaces (Header's glass pill, Footer's
 * dark band) it currently appears on — see Header's original sourcing note
 * for why `logoLightUrl` (not `logoDarkUrl`) is the correct field to read on
 * those surfaces despite the easy-to-misread field name.
 */
export function BrandLogo({ logo = null, className = 'h-9 w-24', sizes = '96px' }: BrandLogoProps) {
  const logoSrc = logo?.logoLightUrl ?? logo?.logoDarkUrl ?? DEFAULT_LOGO_SRC;

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
