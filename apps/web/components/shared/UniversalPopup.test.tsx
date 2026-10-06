import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MessengersProvider } from '@/components/shared/MessengersProvider';
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

describe('UniversalPopup — continue in messenger', () => {
  beforeEach(() => submitLead.mockClear());

  async function submitWithChannel(channel: 'whatsapp' | 'viber' | 'call', links: object) {
    renderWithLocale(
      <MessengersProvider links={{ whatsapp: null, viber: null, telegram: null, ...links }}>
        <UniversalPopup open onClose={() => {}} sourcePage="/" sourceCta="hero" />
      </MessengersProvider>,
      'en',
    );
    fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText(m.phoneLabel), { target: { value: '77123456' } });
    fireEvent.click(screen.getByRole('button', { name: m.next }));
    fireEvent.click(screen.getByRole('button', { name: m.channelOptions[channel] }));
    fireEvent.click(screen.getByRole('button', { name: m.submit }));
    await waitFor(() => expect(submitLead).toHaveBeenCalled());
  }

  it('offers a prefilled WhatsApp deep link after submitting with WhatsApp chosen', async () => {
    await submitWithChannel('whatsapp', { whatsapp: 'https://wa.me/37493882818' });
    const link = await screen.findByRole('link', { name: /Continue in WhatsApp/ });
    const href = link.getAttribute('href')!;
    expect(href.startsWith('https://wa.me/37493882818?text=')).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1]!)).toContain('Anna');
  });

  it('uses the Viber deep link as-is', async () => {
    await submitWithChannel('viber', { viber: 'viber://chat?number=%2B37493882818' });
    expect(await screen.findByRole('link', { name: /Continue in Viber/ })).toHaveAttribute(
      'href',
      'viber://chat?number=%2B37493882818',
    );
  });

  it('shows no button when the admin has not configured that messenger, or for "call"', async () => {
    await submitWithChannel('whatsapp', {});
    await screen.findByRole('status');
    expect(screen.queryByRole('link', { name: /Continue in/ })).not.toBeInTheDocument();
  });
});
