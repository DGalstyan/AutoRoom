import { describe, expect, it, vi } from 'vitest';
import { HomeFaq } from '@/components/shared/HomeFaq';
import { getHomepageFaq } from '@/lib/faq';

vi.mock('@/lib/faq', () => ({ getHomepageFaq: vi.fn() }));
// `HomeFaq` now reads the visitor's locale (so FAQ content is shown in the
// site's actual language, not always Armenian) — `getLocale` calls
// `next/headers`' `cookies()`, which throws outside a real request scope.
vi.mock('@/lib/i18n', () => ({ getLocale: vi.fn().mockResolvedValue('hy') }));

describe('HomeFaq', () => {
  it('renders nothing when there is no published FAQ content', async () => {
    vi.mocked(getHomepageFaq).mockResolvedValue([]);
    expect(await HomeFaq()).toBeNull();
  });

  it('passes fetched items through to Faq with the heading hidden', async () => {
    const items = [{ q: 'Q?', a: 'A.' }];
    vi.mocked(getHomepageFaq).mockResolvedValue(items);

    const element = await HomeFaq();

    expect(element).not.toBeNull();
    expect(element?.props).toMatchObject({ items, hideHeading: true });
  });
});
