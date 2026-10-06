import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('defaults to a white 32px-radius card with 24px padding and no shadow', () => {
    render(<Card data-testid="c">x</Card>);
    const el = screen.getByTestId('c');
    expect(el).toHaveClass('bg-white', 'rounded-xl', 'p-6');
    expect(el).not.toHaveClass('shadow-card');
  });
  it('supports tone, radius, padding and raised', () => {
    render(
      <Card data-testid="c" tone="dark" radius="lg" padding="none" raised>
        x
      </Card>,
    );
    const el = screen.getByTestId('c');
    expect(el).toHaveClass('bg-surface', 'rounded-lg', 'shadow-card');
    expect(el).not.toHaveClass('p-6');
  });
  it('renders the requested element', () => {
    render(
      <Card as="article" data-testid="c">
        x
      </Card>,
    );
    expect(screen.getByTestId('c').tagName).toBe('ARTICLE');
  });
});
