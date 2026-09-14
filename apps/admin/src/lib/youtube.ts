/**
 * Turns whatever URL shape an editor pastes for a video (a full
 * `youtube.com/watch?v=…` link, a shared `youtu.be/…` link, a `/shorts/…`
 * link, or an already-correct `/embed/…` link) into the one shape an
 * `<iframe>` can use as `src`, so the Stories & video dialog can preview a
 * YouTube-hosted founder film the same way the public site plays it
 * (`apps/web/lib/youtube.ts` — kept in sync with this copy since the admin
 * and public site are separate packages with no shared runtime code).
 *
 * Resolves to `youtube-nocookie.com` regardless of the input host. Returns
 * `null` for anything that isn't a recognizable YouTube URL, so the caller
 * can fall back to treating the value as a directly-hosted file instead.
 */
export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1);
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v');
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.slice('/embed/'.length);
    } else if (parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.slice('/shorts/'.length);
    }
  }

  id = id?.split('/')[0]?.trim() || null;

  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
