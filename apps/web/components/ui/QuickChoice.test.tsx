import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QuickChoice } from '@/components/ui/QuickChoice';

const FOUR = ['a', 'b', 'c', 'd'].map((k) => ({ key: k, label: k.toUpperCase() }));

describe('QuickChoice', () => {
  it('renders ≤4 options as chips under a visible legend', () => {
    render(<QuickChoice label="Budget" options={FOUR} value={undefined} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('one tap selects; tapping the selected chip clears it', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <QuickChoice label="Budget" options={FOUR} value={undefined} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenLastCalledWith('b');
    rerender(<QuickChoice label="Budget" options={FOUR} value="b" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('falls back to a labelled dropdown above 4 options', () => {
    const onChange = vi.fn();
    const many = [...FOUR, { key: 'e', label: 'E' }];
    render(<QuickChoice label="Timing" options={many} value="e" onChange={onChange} />);
    const select = screen.getByLabelText('Timing');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('e');
    fireEvent.change(select, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
