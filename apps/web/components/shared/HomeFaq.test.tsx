import { describe, expect, it, vi } from 'vitest';
import { HomeFaq } from '@/components/shared/HomeFaq';
import { getHomepageFaq } from '@/lib/faq';

vi.mock('@/lib/faq', () => ({ getHomepageFaq: vi.fn() }));

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
