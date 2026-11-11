import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { UsaAuctionContactPopup } from '@/components/usa/UsaAuctionContactPopup';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const submitLead = vi.fn().mockResolvedValue({ ok: true });
vi.mock('@/lib/actions/leads', () => ({ submitLead: (p: unknown) => submitLead(p) }));

const m = getMessagesForLocale('ru');

describe('USA auction popup — Figma form', () => {
  beforeEach(() => submitLead.mockClear());

  it('sends the free-text budget and the financing switch with the lead context', async () => {
    renderWithLocale(
      <UsaAuctionContactPopup
        open
        onClose={() => {}}
        sourcePage="/usa"
        sourceCta="usa-final-cta"
      />,
      'ru',
    );
    fireEvent.change(screen.getByLabelText(m.usa.auctionPopup.nameLabel), {
      target: { value: 'Anna' },
    });
    fireEvent.change(screen.getByLabelText(m.usa.auctionPopup.phoneLabel), {
      target: { value: '77123456' },
    });
    fireEvent.change(screen.getByLabelText(m.usa.auctionPopup.budgetLabel), {
      target: { value: '129000000 AMD' },
    });
    const financing = screen.getByRole('switch', { name: m.usa.auctionPopup.financingLabel });
    expect(financing).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(financing);
    fireEvent.click(screen.getByRole('button', { name: m.usa.auctionPopup.submit }));

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const { answers, hidden } = submitLead.mock.calls[0]![0];
    expect(answers).toMatchObject({
      budget: '129000000 AMD',
      financing: 'no',
    });
    expect(hidden).toMatchObject({ sourcePage: '/usa', sourceCta: 'usa-final-cta', locale: 'ru' });
    expect(hidden.timestamp).toMatch(/^\d{4}-/);
    expect(['mobile', 'tablet', 'desktop']).toContain(hidden.device);
  });
});
