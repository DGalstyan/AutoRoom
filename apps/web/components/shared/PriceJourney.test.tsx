import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PriceJourney } from '@/components/shared/PriceJourney';
import { renderWithLocale } from '@/lib/test-utils';
import type { PriceChip } from '@/lib/types/car';

vi.mock('@/components/shared/LeadWidgetProvider', () => ({
  useLeadWidgets: () => ({ openUniversal: vi.fn(), openQuiz: vi.fn(), isAnyOpen: false }),
}));

const chip = (amount: number, hy: string): PriceChip => ({ label: { hy }, amount });
const LI_L9_CHIPS = [
  chip(52000, 'Գին Չինաստանում'),
  chip(4300, 'Տեղափոխում'),
  chip(9800, 'Մաքսազերծում'),
  chip(2500, 'Ծառայություն'),
];
const CAR = { id: 'li-l9', name: 'Li Auto L9', url: '/china/li-auto-l9' } as never;

// Observer that never reports the section as visible — what a tall section on
// a small phone looks like. The formula used to stay at "= 0 $" here.
class NeverVisibleObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

describe('PriceJourney total row', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NeverVisibleObserver);
  });

  it('shows the real sum even if the section never scrolls into view', () => {
    renderWithLocale(<PriceJourney chips={LI_L9_CHIPS} car={CAR} />);
    const formula = screen.getByText(/^52,000 \$ \+ 4,300 \$ \+ 9,800 \$ \+ 2,500 \$ =/);
    expect(formula).toHaveTextContent('= 68,600 $');
    expect(formula).not.toHaveTextContent('= 0 $');
  });

  it('shows the real sum immediately with reduced motion', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          queueMicrotask(() =>
            cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never),
          );
        }
        observe() {}
        disconnect() {}
      },
    );
    window.matchMedia = ((q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as never;
    renderWithLocale(<PriceJourney chips={LI_L9_CHIPS} car={CAR} />);
    expect(screen.getByText(/= 68,600 \$$/)).toBeInTheDocument();
  });

  it('renders nothing without chips', () => {
    const { container } = renderWithLocale(<PriceJourney chips={[]} car={CAR} />);
    expect(container).toBeEmptyDOMElement();
  });
});
