import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanCalculator } from '@/components/shared/LoanCalculator';
import { renderWithLocale } from '@/lib/test-utils';
import type { Car, FinanceCalculator } from '@/lib/types/car';

const FINANCE: FinanceCalculator = {
  termMonths: 60,
  nominalRate: 15.9,
  effectiveRateMin: 17.11,
  effectiveRateMax: 17.19,
  minDownPaymentRatio: 0.1,
  maxDownPaymentRatio: 0.7,
  defaultDownPaymentRatio: 0.2,
  usdToAmd: 390,
  disclaimer: null,
};
const CAR = { price: 20000, images: [] } as unknown as Pick<Car, 'price' | 'images'>;

describe('LoanCalculator down payment', () => {
  it('is an editable field that follows the slider and clamps to the allowed range', async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanCalculator car={CAR} finance={FINANCE} />);
    const field = screen.getByRole('textbox', { name: 'Կանխավճար' });
    expect(field).toHaveValue('4,000$');

    await user.click(field!);
    await user.clear(field!);
    await user.type(field!, '6000');
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('6000');

    await user.tab();
    expect(field).toHaveValue('6,000$');

    await user.clear(field!);
    await user.type(field!, '99999');
    await user.tab();
    expect(field).toHaveValue('14,000$');
  });

  it('works everything out from the editable price', async () => {
    const user = userEvent.setup();
    renderWithLocale(<LoanCalculator car={CAR} finance={FINANCE} />);
    const price = screen.getByRole('textbox', { name: 'Գին' });
    const down = screen.getByRole('textbox', { name: 'Կանխավճար' });
    expect(price).toHaveValue('20,000$');

    await user.click(price);
    await user.clear(price);
    await user.type(price, '50000');
    // 20% down by default on the new price, and the slider range follows it (10%–70%).
    expect(down).toHaveValue('10,000$');
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '5000');
    expect(slider).toHaveAttribute('max', '35000');

    await user.tab();
    expect(price).toHaveValue('50,000$');
  });
});
