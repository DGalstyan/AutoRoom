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
// a small phone looks like. The formula used to stay at "= 0$" here.
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
    const total = screen.getByText('68,600$');
    expect(total).toHaveClass('text-[24px]', 'font-bold', 'tabular-nums');
    expect(screen.queryByText('0$')).not.toBeInTheDocument();
    // Figma draws neither the per-step amounts nor the sum line, only the numbered steps and the total.
    expect(screen.queryByText('52,000 $ + 4,300 $ + 9,800 $ + 2,500$')).toBeNull();
    expect(screen.queryByText('52,000$')).toBeNull();
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
    expect(screen.getByText('68,600$')).toBeInTheDocument();
  });

  it('without chips shows the four standard steps and a dash for the final value', () => {
    renderWithLocale(<PriceJourney chips={[]} car={CAR} />);
    expect(screen.getByText('Մեքենայի արժեքը Չինաստանում')).toBeInTheDocument();
    expect(screen.getByText('Մաքսազերծում (մոտավոր)')).toBeInTheDocument();
    expect(screen.getByText('Վերջնական արժեք')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it("without chips shows the car's own estimated final price", () => {
    renderWithLocale(<PriceJourney chips={[]} car={CAR} estFinal={14254} />);
    expect(screen.getByText('14,254$')).toBeInTheDocument();
  });
});
