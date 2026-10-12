/**
 * Image links stored on the public site's own files (`/images/home/...` for the demo cars) are
 * relative to the PUBLIC site, so in the admin — a different origin — they resolve to nothing and
 * the thumbnail shows broken. Resolve those against the public site; uploads and other absolute
 * links are left as they are.
 */
const WEB = (import.meta.env.VITE_WEB_URL as string | undefined)?.replace(/\/+$/, '');

export function assetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') && !url.startsWith('//') && WEB ? `${WEB}${url}` : url;
}
