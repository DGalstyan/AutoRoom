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

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1), { timeout: 5000 });
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

  it('carries the expected arrival day for a "reserve before it arrives" lead and shows it on the car card', async () => {
    renderWithLocale(
      <UniversalPopup
        open
        onClose={() => {}}
        sourcePage="/china/li-auto-l9"
        sourceCta="car-detail-reserve-before-arrival"
        car={{ id: 'car_1', name: 'Li Auto L9', vin: 'VIN1', url: '/x', arrivalDate: '2026-10-27' }}
      />,
      'en',
    );
    expect(screen.getByText(`${m.arrivalLabel}: 27.10.2026`)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText(m.phoneLabel), { target: { value: '77123456' } });
    fireEvent.click(screen.getByRole('button', { name: m.submitPerCar }));
    await waitFor(() => expect(submitLead).toHaveBeenCalled());
    expect(submitLead.mock.calls[0]![0].hidden.car).toMatchObject({
      id: 'car_1',
      vin: 'VIN1',
      arrivalDate: '2026-10-27',
    });
  });
});

describe('UniversalPopup single screen', () => {
  beforeEach(() => submitLead.mockClear());

  it('shows the two required fields and the optional chips together, with no steps', () => {
    renderWithLocale(
      <UniversalPopup open onClose={() => {}} sourcePage="/" sourceCta="hero" />,
      'en',
    );
    expect(screen.getByLabelText(m.nameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(m.phoneLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: m.interestOptions.usa })).toBeInTheDocument();
    // One screen: just name and phone as text fields (no comment box), and no "step 1 / 3" counter.
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.queryByText(/\d\s*\/\s*\d/)).not.toBeInTheDocument();
  });

  it('cannot be sent without a name and a phone, and can be sent with only those two', async () => {
    renderWithLocale(
      <UniversalPopup open onClose={() => {}} sourcePage="/" sourceCta="hero" />,
      'en',
    );
    expect(screen.getByRole('button', { name: m.submit })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText(m.phoneLabel), { target: { value: '77123456' } });
    fireEvent.click(screen.getByRole('button', { name: m.submit }));
    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(submitLead.mock.calls[0]![0].answers).toMatchObject({ name: 'Anna' });
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

describe('UniversalPopup when the send fails', () => {
  beforeEach(() => submitLead.mockReset());

  function fill() {
    renderWithLocale(
      <UniversalPopup open onClose={() => {}} sourcePage="/" sourceCta="hero" />,
      'en',
    );
    fireEvent.change(screen.getByLabelText(m.nameLabel), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByLabelText(m.phoneLabel), { target: { value: '77123456' } });
  }

  it('shows an error and a live retry button when the request is rejected, not a frozen "Sending…"', async () => {
    submitLead.mockRejectedValueOnce(new Error('Failed to fetch'));
    fill();
    fireEvent.click(screen.getByRole('button', { name: m.submit }));

    expect(await screen.findByRole('alert')).toHaveTextContent(m.sendFailed);
    const retry = screen.getByRole('button', { name: m.retry });
    expect(retry).toBeEnabled();
    expect(screen.queryByText(m.sending)).not.toBeInTheDocument();
  });

  it('does not show success when the API answered not-ok, and a retry that works does', async () => {
    submitLead.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    fill();
    fireEvent.click(screen.getByRole('button', { name: m.submit }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: m.retry }));
    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(2), { timeout: 5000 });
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
