import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArmeniaMap } from '@/components/shared/ArmeniaMap';
import { BRANCHES } from '@/lib/data/branches';

describe('ArmeniaMap', () => {
  it('renders one pin per branch, each labeled with its name, city, and address', () => {
    render(<ArmeniaMap activeId={BRANCHES[0].id} onSelect={vi.fn()} />);

    for (const branch of BRANCHES) {
      expect(
        screen.getByRole('button', {
          name: `${branch.name} — ${branch.city}, ${branch.address}`,
        }),
      ).toBeInTheDocument();
    }
  });

  // The tooltip is deliberately `aria-hidden` — its content already lives in
  // the pin button's own `aria-label`, so a screen reader is never meant to
  // reach it directly. That means `getByRole('tooltip')` would always find
  // nothing regardless of whether it's actually rendered, making it useless
  // here — query the DOM directly instead.
  function queryTooltip(): HTMLElement | null {
    return document.querySelector('[role="tooltip"]');
  }

  it('shows no tooltip until a pin is hovered or focused', () => {
    render(<ArmeniaMap activeId={BRANCHES[0].id} onSelect={vi.fn()} />);
    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('shows the name and address in a tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<ArmeniaMap activeId={BRANCHES[0].id} onSelect={vi.fn()} />);

    const target = BRANCHES[1];
    const pin = screen.getByRole('button', {
      name: `${target.name} — ${target.city}, ${target.address}`,
    });

    await user.hover(pin);
    const tooltip = queryTooltip();
    expect(tooltip).toHaveTextContent(`${target.name} — ${target.city}`);
    expect(tooltip).toHaveTextContent(target.address);

    await user.unhover(pin);
    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('shows the tooltip on keyboard focus too, not just mouse hover', async () => {
    const user = userEvent.setup();
    render(<ArmeniaMap activeId={BRANCHES[0].id} onSelect={vi.fn()} />);

    const target = BRANCHES[0];
    const pin = screen.getByRole('button', {
      name: `${target.name} — ${target.city}, ${target.address}`,
    });

    await user.tab();
    expect(pin).toHaveFocus();
    expect(queryTooltip()).toHaveTextContent(target.address);
  });

  it('calls onSelect with the clicked branch id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ArmeniaMap activeId={BRANCHES[0].id} onSelect={onSelect} />);

    const target = BRANCHES[2];
    await user.click(
      screen.getByRole('button', {
        name: `${target.name} — ${target.city}, ${target.address}`,
      }),
    );

    expect(onSelect).toHaveBeenCalledWith(target.id);
  });

  it('marks the active branch pin as pressed', () => {
    render(<ArmeniaMap activeId={BRANCHES[1].id} onSelect={vi.fn()} />);

    const activeBranch = BRANCHES[1];
    const activePin = screen.getByRole('button', {
      name: `${activeBranch.name} — ${activeBranch.city}, ${activeBranch.address}`,
    });
    expect(activePin).toHaveAttribute('aria-pressed', 'true');

    const inactiveBranch = BRANCHES[0];
    const inactivePin = screen.getByRole('button', {
      name: `${inactiveBranch.name} — ${inactiveBranch.city}, ${inactiveBranch.address}`,
    });
    expect(inactivePin).toHaveAttribute('aria-pressed', 'false');
  });
});
