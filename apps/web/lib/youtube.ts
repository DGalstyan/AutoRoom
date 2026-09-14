/**
 * Turns whatever URL shape an admin pastes into `Media.videoUrl` (a full
 * `youtube.com/watch?v=…` link, a shared `youtu.be/…` link, a `/shorts/…`
 * link, or an already-correct `/embed/…` link) into the one shape an
 * `<iframe>` can use as `src`.
 *
 * Resolves to `youtube-nocookie.com` regardless of the input host — the
 * privacy-enhanced domain defers setting cookies until playback starts,
 * which is the safer default for a video nobody has pressed play on yet.
 *
 * Returns `null` for anything that isn't a recognizable YouTube URL, so a
 * caller can fall back to a non-YouTube treatment instead of rendering a
 * broken iframe.
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

  // Strip anything trailing that isn't part of the id itself (e.g. `/embed/xyz/`
  // or a stray path segment after a shorts link).
  id = id?.split('/')[0]?.trim() || null;

  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
