import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ChinaFilters } from '@/components/china/ChinaFilters';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const t = getMessagesForLocale('hy').china.filters;

const push = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => '/china',
  useSearchParams: () => new URLSearchParams(search),
}));

const MAKES = { BYD: ['Seal', 'Han'], Zeekr: ['001'] };

describe('ChinaFilters', () => {
  beforeEach(() => {
    push.mockClear();
    search = '';
  });

  it('shows the result count and no chips or reset when nothing is filtered', () => {
    renderWithLocale(<ChinaFilters makeModels={MAKES} total={12} />);
    expect(screen.getByRole('status')).toHaveTextContent('12');
    expect(screen.queryByRole('button', { name: t.reset })).not.toBeInTheDocument();
  });

  it('says so when nothing matches', () => {
    renderWithLocale(<ChinaFilters makeModels={MAKES} total={0} />);
    expect(screen.getByRole('status')).toHaveTextContent(t.resultCountNone);
  });

  it('puts the search term in the URL (q) on submit', () => {
    renderWithLocale(<ChinaFilters makeModels={MAKES} total={3} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' byd seal ' } });
    fireEvent.click(screen.getByRole('button', { name: t.searchSubmit }));
    expect(push).toHaveBeenCalledWith('/china?q=byd+seal', { scroll: false });
  });

  it('shows a chip per active filter, and each one removes just its own filter', () => {
    search = 'q=seal&make=BYD&condition=IN_STOCK';
    renderWithLocale(<ChinaFilters makeModels={MAKES} total={1} />);
    const list = screen.getByRole('list', { name: t.activeFilters });
    expect(list.querySelectorAll('li')).toHaveLength(3);
    fireEvent.click(
      screen.getByRole('button', {
        name: t.removeFilter.replace('{label}', `${t.makePrefix}: BYD`),
      }),
    );
    expect(push).toHaveBeenCalledWith('/china?q=seal&condition=IN_STOCK', { scroll: false });
  });

  it('reset clears every filter back to the bare path', () => {
    search = 'q=seal&make=BYD&priceMin=20000';
    renderWithLocale(<ChinaFilters makeModels={MAKES} total={1} />);
    fireEvent.click(screen.getByRole('button', { name: t.reset }));
    expect(push).toHaveBeenCalledWith('/china', { scroll: false });
  });
});
