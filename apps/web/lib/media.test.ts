import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFounderVideo, listGuideReels } from '@/lib/media';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

describe('getFounderVideo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches published FOUNDER-kind media only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await getFounderVideo();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/public/media?kind=FOUNDER'),
      expect.objectContaining({ next: { revalidate: 300 } }),
    );
  });

  it('maps the first item to { title, videoUrl, posterUrl }', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: [
            {
              kind: 'FOUNDER',
              title: 'Ինչպես ստեղծվեց AutoRoom-ը',
              videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
              posterUrl: 'https://cdn.example.com/founder-poster.jpg',
            },
          ],
          total: 1,
        }),
      ),
    );

    expect(await getFounderVideo()).toEqual({
      title: 'Ինչպես ստեղծվեց AutoRoom-ը',
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      posterUrl: 'https://cdn.example.com/founder-poster.jpg',
    });
  });

  it('returns null when no FOUNDER row is published', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 })));

    expect(await getFounderVideo()).toBeNull();
  });

  it('returns null on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));

    expect(await getFounderVideo()).toBeNull();
  });

  it('returns null on a network error, never throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(getFounderVideo()).resolves.toBeNull();
  });
});

describe('listGuideReels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches published GUIDE_REEL-kind media only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await listGuideReels();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/public/media?kind=GUIDE_REEL'),
      expect.objectContaining({ next: { revalidate: 300 } }),
    );
  });

  it('maps every item to { id, title, videoUrl, posterUrl }', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: [
            {
              id: 'reel-1',
              kind: 'GUIDE_REEL',
              title: 'VIN ստուգում',
              videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
              posterUrl: 'https://cdn.example.com/reel-1.jpg',
            },
          ],
          total: 1,
        }),
      ),
    );

    expect(await listGuideReels()).toEqual([
      {
        id: 'reel-1',
        title: 'VIN ստուգում',
        videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        posterUrl: 'https://cdn.example.com/reel-1.jpg',
      },
    ]);
  });

  it('returns [] on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));

    expect(await listGuideReels()).toEqual([]);
  });

  it('returns [] on a network error, never throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(listGuideReels()).resolves.toEqual([]);
  });
});
