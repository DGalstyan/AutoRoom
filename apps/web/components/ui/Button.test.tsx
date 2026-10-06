import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button CTA levels', () => {
  it('L1 primary is gold with ink text (never white on gold)', () => {
    render(<Button>Go</Button>);
    const el = screen.getByRole('button', { name: 'Go' });
    expect(el).toHaveClass('bg-accent', 'text-ink');
    expect(el).not.toHaveClass('text-white');
  });
  it('L2 outline has a border and no fill', () => {
    render(<Button variant="outline">Alt</Button>);
    expect(screen.getByRole('button', { name: 'Alt' })).toHaveClass('border', 'bg-transparent');
  });
  it('L3 tertiary is text-only', () => {
    render(<Button variant="tertiary">Back</Button>);
    const el = screen.getByRole('button', { name: 'Back' });
    expect(el).toHaveClass('bg-transparent', 'hover:underline');
    expect(el).not.toHaveClass('border');
  });
  it.each(['md', 'lg', 'xl'] as const)('size %s keeps a ≥44px touch target', (size) => {
    render(<Button size={size}>X</Button>);
    expect(screen.getByRole('button', { name: 'X' })).toHaveClass('min-h-11');
  });
  it('renders internal hrefs as links and defaults buttons to type=button', () => {
    render(
      <>
        <Button href="tel:+37400">Call</Button>
        <Button>Plain</Button>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+37400');
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute('type', 'button');
  });
});
