import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { UsaAuctionContactPopup } from '@/components/usa/UsaAuctionContactPopup';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const submitLead = vi.fn().mockResolvedValue({ ok: true });
vi.mock('@/lib/actions/leads', () => ({ submitLead: (p: unknown) => submitLead(p) }));

const m = getMessagesForLocale('ru');

describe('USA auction popup — quick qualification', () => {
  beforeEach(() => submitLead.mockClear());

  it('answers budget, financing, timing and channel with chips and sends them with the lead context', async () => {
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
    const p = m.common.popup;
    fireEvent.click(screen.getByRole('button', { name: p.budgetOptions['20-35k'] }));
    fireEvent.click(screen.getByRole('button', { name: p.timingOptions.now }));
    fireEvent.click(screen.getByRole('button', { name: p.channelOptions.viber }));
    fireEvent.click(screen.getByRole('button', { name: m.usa.auctionPopup.submit }));

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    const { answers, hidden } = submitLead.mock.calls[0]![0];
    expect(answers).toMatchObject({
      budget: '20-35k',
      financing: 'need',
      timing: 'now',
      channel: 'viber',
    });
    expect(hidden).toMatchObject({ sourcePage: '/usa', sourceCta: 'usa-final-cta', locale: 'ru' });
    expect(hidden.timestamp).toMatch(/^\d{4}-/);
    expect(['mobile', 'tablet', 'desktop']).toContain(hidden.device);
  });
});
