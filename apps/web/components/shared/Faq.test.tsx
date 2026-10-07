import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Faq } from '@/components/shared/Faq';
import { renderWithLocale } from '@/lib/test-utils';

const items = [
  { q: 'First?', a: 'Answer one.' },
  { q: 'Second?', a: 'Answer two.' },
];

describe('Faq accordion (Figma 436:2012)', () => {
  it('opens the first question by default, the rest closed', () => {
    renderWithLocale(<Faq items={items} hideHeading />);
    expect(screen.getByRole('button', { name: 'First?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Second?' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('toggles one at a time; a closed answer is inert (not reachable)', () => {
    renderWithLocale(<Faq items={items} hideHeading />);
    fireEvent.click(screen.getByRole('button', { name: 'Second?' }));
    expect(screen.getByRole('button', { name: 'Second?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'First?' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    const regions = document.querySelectorAll('[role="region"]');
    expect(regions[0]!.hasAttribute('inert')).toBe(true);
    expect(regions[1]!.hasAttribute('inert')).toBe(false);
  });

  it('closed items are the pill-shaped rows, the open one a 32px card', () => {
    const { container } = renderWithLocale(<Faq items={items} hideHeading />);
    const cards = container.querySelectorAll('h3 + div, h3');
    expect(container.querySelector('.rounded-\\[32px\\]')).not.toBeNull();
    expect(container.querySelector('.rounded-\\[236px\\]')).not.toBeNull();
    expect(cards.length).toBeGreaterThan(0);
  });

  it('keeps the 760px column', () => {
    const { container } = renderWithLocale(<Faq items={items} hideHeading />);
    expect(container.querySelector('.max-w-\\[760px\\]')).not.toBeNull();
  });
});
