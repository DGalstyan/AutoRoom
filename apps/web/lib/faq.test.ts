import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHomepageFaq } from '@/lib/faq';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

describe('getHomepageFaq', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches GENERAL-topic questions only, not an unfiltered aggregate', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await getHomepageFaq();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/public/faq?topic=GENERAL'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('sorts by position and maps to {q, a}, dropping the answer wrapper', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: [
            {
              id: '2',
              topic: 'GENERAL',
              question: { hy: 'Second?' },
              answer: { hy: 'B' },
              position: 1,
              publishedAt: '2026-01-01',
            },
            {
              id: '1',
              topic: 'GENERAL',
              question: { hy: 'First?' },
              answer: { hy: 'A' },
              position: 0,
              publishedAt: '2026-01-01',
            },
          ],
          total: 2,
        }),
      ),
    );

    const result = await getHomepageFaq();

    expect(result).toEqual([
      { q: 'First?', a: 'A' },
      { q: 'Second?', a: 'B' },
    ]);
  });

  it('excludes items without a written answer, even if published', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          items: [
            {
              id: '1',
              topic: 'GENERAL',
              question: { hy: 'Answered?' },
              answer: { hy: 'Yes' },
              position: 0,
              publishedAt: '2026-01-01',
            },
            {
              id: '2',
              topic: 'GENERAL',
              question: { hy: 'Unanswered?' },
              answer: null,
              position: 1,
              publishedAt: null,
            },
          ],
          total: 2,
        }),
      ),
    );

    const result = await getHomepageFaq();

    expect(result).toEqual([{ q: 'Answered?', a: 'Yes' }]);
  });

  it('returns an empty array on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));

    expect(await getHomepageFaq()).toEqual([]);
  });

  it('returns an empty array on a network error, never throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(getHomepageFaq()).resolves.toEqual([]);
  });
});
