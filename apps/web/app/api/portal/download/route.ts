import type { NextRequest } from 'next/server';
import { apiBase } from '@/lib/env';

/**
 * Hands an uploaded file to the browser as a download. The files live on the API's origin, and a
 * cross-origin link ignores the `download` attribute (the browser would just open the image), so
 * the file is streamed through here instead. Only the stored file name is accepted — never a URL —
 * and it is read from the API's own `/uploads`, so this cannot be pointed at anything else.
 */
const FILE_NAME = /^[a-z0-9]{8,64}\.[a-z0-9]{2,5}$/i;

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file') ?? '';
  if (!FILE_NAME.test(file)) return new Response('Bad file name', { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}/uploads/${file}`, { signal: AbortSignal.timeout(30_000) });
  } catch {
    return new Response('Could not reach the file', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });

  // Offer the document's own title as the saved name (keeping the real extension).
  const extension = file.slice(file.lastIndexOf('.'));
  const title = (request.nextUrl.searchParams.get('name') ?? '')
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .trim()
    .slice(0, 120);
  const saveAs = title
    ? title.toLowerCase().endsWith(extension.toLowerCase())
      ? title
      : `${title}${extension}`
    : file;

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file}"; filename*=UTF-8''${encodeURIComponent(saveAs)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
