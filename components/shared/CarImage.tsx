import { cn } from '@/lib/utils';

/**
 * Every car photo on the site goes through here.
 *
 * It is a plain `<img>` on purpose: the catalogue serves absolute URLs from an
 * external source (and SVG placeholders while the real photography is pending),
 * neither of which `next/image` handles without `remotePatterns` +
 * `dangerouslyAllowSVG`. Keeping it in one component means P7.3 can switch the
 * whole site to `next/image` by editing this file alone.
 */
export function CarImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Hero images above the fold skip lazy loading. */
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the note above
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}
