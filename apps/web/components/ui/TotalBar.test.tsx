import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreakdownRow, TotalBar } from '@/components/ui/TotalBar';

describe('calculator hierarchy', () => {
  it('TotalBar shows the result at total size, bold, tabular', () => {
    render(<TotalBar label="Monthly" value="AMD 250,000" />);
    const value = screen.getByText('AMD 250,000');
    expect(value).toHaveClass('text-price-total', 'sm:text-[36px]', 'font-bold', 'tabular-nums');
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('breakdown rows are quieter than the total: regular body size, medium weight', () => {
    render(<BreakdownRow label="Term" value="60" />);
    const value = screen.getByText('60');
    expect(value).toHaveClass('text-body', 'font-medium', 'tabular-nums');
    expect(value).not.toHaveClass('font-bold');
    expect(value.className).not.toMatch(/text-price/);
  });

  it('renders supporting content under the total', () => {
    render(
      <TotalBar label="Final" value="10 $">
        1 $ + 9 $
      </TotalBar>,
    );
    expect(screen.getByText('1 $ + 9 $')).toBeInTheDocument();
  });
});
