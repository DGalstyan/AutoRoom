import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { UniversalPopup } from '@/components/shared/UniversalPopup';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const submitLead = vi.fn().mockResolvedValue({ ok: true });
vi.mock('@/lib/actions/leads', () => ({ submitLead: (p: unknown) => submitLead(p) }));

const m = getMessagesForLocale('en').common.popup;

describe('UniversalPopup lead context', () => {
  beforeEach(() => submitLead.mockClear());

  it('sends vehicle id/VIN/lot, page, CTA, the live language, device and timestamp', async () => {
    renderWithLocale(
      <UniversalPopup
        open
        onClose={() => {}}
        sourcePage="/china/li-auto-l9"
        sourceCta="car-detail-per-car-offer"
        car={{
          id: 'car_123',
          name: 'Li Auto L9',
          vin: 'LW433B1K5N1000001',
          lot: '58392011',
          url: '/china/li-auto-l9',
        }}
      />,
      'en',
    );
    fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText(m.phoneLabel), { target: { value: '77123456' } });
    fireEvent.click(screen.getByRole('button', { name: m.submitPerCar }));

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    const { hidden } = submitLead.mock.calls[0]![0];
    expect(hidden).toMatchObject({
      sourcePage: '/china/li-auto-l9',
      sourceCta: 'car-detail-per-car-offer',
      locale: 'en',
      car: { id: 'car_123', name: 'Li Auto L9', vin: 'LW433B1K5N1000001', lot: '58392011' },
    });
    expect(hidden.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(['mobile', 'tablet', 'desktop']).toContain(hidden.device);
  });
});
