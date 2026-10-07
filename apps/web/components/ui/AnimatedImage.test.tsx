import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedImage } from '@/components/ui/AnimatedImage';

function stubMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes('reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never;
}

describe('AnimatedImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('always paints the poster, and layers the animation over it', async () => {
    stubMotion(false);
    const { container } = render(
      <AnimatedImage src="/a.webp" poster="/p.webp" alt="Hero" priority />,
    );
    expect(screen.getByAltText('Hero')).toHaveAttribute('src', '/p.webp');
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2));
    expect(container.querySelectorAll('img')[1]).toHaveAttribute('src', '/a.webp');
  });

  it('shows only the poster to visitors who prefer reduced motion', async () => {
    stubMotion(true);
    const { container } = render(<AnimatedImage src="/a.webp" poster="/p.webp" />);
    await Promise.resolve();
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('with lazy, does not request the animation until the block is near the viewport', async () => {
    stubMotion(false);
    let trigger: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          trigger = (e) => cb(e as IntersectionObserverEntry[], this as never);
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<AnimatedImage src="/a.webp" poster="/p.webp" lazy />);
    await Promise.resolve();
    expect(container.querySelectorAll('img')).toHaveLength(1);
    trigger([{ isIntersecting: true }]);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2));
  });
});
