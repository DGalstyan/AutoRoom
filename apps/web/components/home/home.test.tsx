import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CountryCard } from '@/components/home/CountryCard';
import { CtaBand } from '@/components/home/CtaBand';
import { HomeHero } from '@/components/home/HomeHero';
import { JourneyStrip } from '@/components/home/JourneyStrip';
import { WhyAutoRoom } from '@/components/home/WhyAutoRoom';
import { WeeklyOffers } from '@/components/home/WeeklyOffers';
import { getFeaturedCars } from '@/lib/cars';
import type { Car } from '@/lib/types/car';

vi.mock('@/lib/cars', () => ({ getFeaturedCars: vi.fn() }));
vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>();
  return {
    ...actual,
    getServerMessages: async () => ({
      locale: 'hy' as const,
      messages: actual.getMessagesForLocale('hy'),
      enabledLocales: ['hy' as const],
    }),
  };
});

describe('HomeHero', () => {
  it('shows the headline as the page h1 and each stat with its label', () => {
    render(
      <HomeHero
        h1="Ներմուծում ենք"
        stats={[
          { value: '50+', label: 'ցանց' },
          { value: '10+', label: 'փորձ' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ներմուծում ենք');
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('փորձ')).toBeInTheDocument();
  });
});

describe('CountryCard', () => {
  it('is one link to the country page, carrying the title', () => {
    render(<CountryCard href="/usa" title="ԱՄՆ" image="/x.webp" imageAlt="Դիտել" size="usa" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/usa');
    expect(link).toHaveTextContent('ԱՄՆ');
    expect(screen.getByAltText('Դիտել')).toBeInTheDocument();
  });
});

describe('CtaBand', () => {
  it('renders heading, optional sub-line and a button that fires the action', () => {
    const onClick = vi.fn();
    render(
      <CtaBand heading="Չե՞ս գտել" sub="Թող տվյալներդ" buttonLabel="Լրացնել" onClick={onClick} />,
    );
    expect(screen.getByRole('heading', { name: 'Չե՞ս գտել' })).toBeInTheDocument();
    expect(screen.getByText('Թող տվյալներդ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Լրացնել' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can link instead of act', () => {
    render(<CtaBand heading="H" buttonLabel="Go" href="/contact" />);
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/contact');
  });
});

describe('JourneyStrip', () => {
  const steps = Array.from({ length: 7 }, (_, i) => ({
    title: `Step ${i + 1}`,
    text: `Text ${i + 1}`,
  }));

  it('lists all seven steps with the first active', () => {
    render(<JourneyStrip heading="Ճանապարհը" steps={steps} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-current', 'step');
    expect(buttons[3]).not.toHaveAttribute('aria-current');
  });

  it('makes a strip active on hover, focus and click', () => {
    render(<JourneyStrip heading="H" steps={steps} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.mouseEnter(buttons[2]!);
    expect(buttons[2]).toHaveAttribute('aria-current', 'step');
    expect(buttons[0]).not.toHaveAttribute('aria-current');
    fireEvent.focus(buttons[4]!);
    expect(buttons[4]).toHaveAttribute('aria-current', 'step');
    fireEvent.click(buttons[6]!);
    expect(buttons[6]).toHaveAttribute('aria-current', 'step');
  });
});

describe('WhyAutoRoom', () => {
  it('renders the stats and the callouts (as pills and as a phone-friendly list)', () => {
    render(
      <WhyAutoRoom
        heading="Ինչո՞ւ"
        hotspots={[{ text: '98% հաջող', left: '10%', top: '10%', width: '20%', height: '7%' }]}
        stats={[{ value: '98%', label: 'հաջող առաքումներ' }]}
      />,
    );
    expect(screen.getByText('հաջող առաքումներ')).toBeInTheDocument();
    // Once as the in-image pill (md+), once in the list shown on phones.
    expect(screen.getAllByText('98% հաջող')).toHaveLength(2);
  });
});

describe('WeeklyOffers', () => {
  const car = (n: number): Car =>
    ({
      id: `c${n}`,
      slug: `car-${n}`,
      origin: 'USA',
      make: 'McLaren',
      model: `720S ${n}`,
      price: 250000 + n,
      condition: 'IN_STOCK',
      images: [
        {
          id: 'i',
          carId: `c${n}`,
          album: 'EXTERIOR',
          url: `/img/${n}.jpg`,
          thumbnailUrl: null,
          position: 0,
        },
      ],
    }) as unknown as Car;

  beforeEach(() => vi.mocked(getFeaturedCars).mockReset());

  it('shows at most four featured cars as links with price and name', async () => {
    vi.mocked(getFeaturedCars).mockResolvedValue([1, 2, 3, 4, 5].map(car));
    render((await WeeklyOffers())!);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute('href', '/usa/available/car-1');
    expect(links[0]).toHaveTextContent('McLaren 720S 1');
    expect(links[0]).toHaveTextContent('250,001 $');
  });

  it('renders nothing (no fake cards) when no car is featured', async () => {
    vi.mocked(getFeaturedCars).mockResolvedValue([]);
    expect(await WeeklyOffers()).toBeNull();
  });
});
