import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Price } from '@/components/ui/Price';
import config from '@/tailwind.config.js';

describe('Price', () => {
  it('is bold with tabular numerals at the 20px size by default', () => {
    render(<Price>1,234 $</Price>);
    expect(screen.getByText('1,234 $')).toHaveClass('font-bold', 'tabular-nums', 'text-price');
  });
  it('lg is the 24px headline size', () => {
    render(<Price size="lg">9 $</Price>);
    expect(screen.getByText('9 $')).toHaveClass('text-price-lg');
  });
  it('total is the 28px → 36px calculator-result size', () => {
    render(<Price size="total">7 $</Price>);
    expect(screen.getByText('7 $')).toHaveClass('text-price-total', 'sm:text-[36px]');
  });
  it('can render as another element', () => {
    render(<Price as="p">5 $</Price>);
    expect(screen.getByText('5 $').tagName).toBe('P');
  });
  it('tokens are 20px and 24px at weight 700', () => {
    const fs = (
      config as {
        theme: { extend: { fontSize: Record<string, [string, { fontWeight: string }]> } };
      }
    ).theme.extend.fontSize;
    expect(fs['price']![0]).toBe('20px');
    expect(fs['price-lg']![0]).toBe('24px');
    expect(fs['price']![1].fontWeight).toBe('700');
    expect(fs['price-lg']![1].fontWeight).toBe('700');
    expect(fs['price-total']![0]).toBe('28px');
    expect(fs['price-total']![1].fontWeight).toBe('700');
  });
});
