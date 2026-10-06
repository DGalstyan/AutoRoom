import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from '@/components/ui/Field';

describe('Field', () => {
  it('shows a persistent label bound to the control', () => {
    render(<Field label="Name">{(a) => <input {...a} placeholder="Anna Hakobyan" />}</Field>);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('placeholder', 'Anna Hakobyan');
    expect(screen.getByText('Name').tagName).toBe('LABEL');
  });

  it('wires hint and error via aria-describedby and flags invalid', () => {
    render(
      <Field label="Phone" hint="+374 XX XXX XXX" error="Required">
        {(a) => <input {...a} />}
      </Field>,
    );
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0]!)).toHaveTextContent('+374 XX XXX XXX');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('is not invalid and has no describedby when clean', () => {
    render(<Field label="Email">{(a) => <input {...a} />}</Field>);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('marks required visually without polluting the accessible name', () => {
    render(
      <Field label="Name" required>
        {(a) => <input {...a} required />}
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: /^Name/ })).toBeRequired();
  });

  it('group mode labels a role=group instead of a label-for', () => {
    render(
      <Field label="Auction" group>
        {() => <button type="button">Copart</button>}
      </Field>,
    );
    expect(screen.getByRole('group', { name: 'Auction' })).toBeInTheDocument();
  });
});
