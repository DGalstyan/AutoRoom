import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { ContactForm } from '@/components/contact/ContactForm';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const submitLead = vi.fn();
vi.mock('@/lib/actions/leads', () => ({ submitLead: (p: unknown) => submitLead(p) }));

const t = getMessagesForLocale('hy').contact.form;

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(t.submit) }));

describe('ContactForm — required name & phone', () => {
  beforeEach(() => {
    submitLead.mockReset();
    submitLead.mockResolvedValue({ ok: true });
  });

  it('marks name and phone as required for assistive tech and sighted users', () => {
    renderWithLocale(<ContactForm />);
    expect(screen.getByLabelText(new RegExp(t.nameLabel))).toBeRequired();
    expect(screen.getByLabelText(new RegExp(t.phoneLabel))).toBeRequired();
    expect(screen.getByLabelText(new RegExp(t.nameLabel))).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText(t.requiredHint)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(t.emailLabel))).not.toBeRequired();
  });

  it('blocks an empty submit client-side, shows both errors and focuses the first bad field', () => {
    renderWithLocale(<ContactForm />);
    submit();
    expect(submitLead).not.toHaveBeenCalled();
    expect(screen.getByText(t.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(t.errors.phoneInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(t.nameLabel))).toHaveFocus();
    expect(screen.getByLabelText(new RegExp(t.nameLabel))).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a whitespace-only or letterless name and an incomplete phone', () => {
    renderWithLocale(<ContactForm />);
    fill(t.nameLabel, '   ');
    fill(t.phoneLabel, '77 12');
    submit();
    expect(submitLead).not.toHaveBeenCalled();
    fill(t.nameLabel, '12345');
    submit();
    expect(screen.getByText(t.errors.nameInvalid)).toBeInTheDocument();
    expect(submitLead).not.toHaveBeenCalled();
  });

  it('does not flag the phone while the visitor has only left the name field', () => {
    renderWithLocale(<ContactForm />);
    fireEvent.blur(screen.getByLabelText(new RegExp(t.nameLabel)));
    expect(screen.getByText(t.errors.nameRequired)).toBeInTheDocument();
    expect(screen.queryByText(t.errors.phoneInvalid)).not.toBeInTheDocument();
  });

  it('submits valid name and phone', async () => {
    renderWithLocale(<ContactForm />);
    fill(t.nameLabel, 'Anna');
    fill(t.phoneLabel, '77123456');
    submit();
    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    expect(submitLead.mock.calls[0]![0].answers).toMatchObject({
      name: 'Anna',
      phone: '+374 77 123 456',
    });
  });

  it('shows the server’s field errors and does NOT show success when the API rejects the lead', async () => {
    submitLead.mockResolvedValue({
      ok: false,
      fieldErrors: { phone: 'Enter a valid phone number' },
    });
    renderWithLocale(<ContactForm />);
    fill(t.nameLabel, 'Anna');
    fill(t.phoneLabel, '77123456');
    submit();
    expect(await screen.findByText(t.errors.phoneInvalid)).toBeInTheDocument();
    expect(screen.queryByText(t.successHeading)).not.toBeInTheDocument();
  });

  it('shows a failure message (not success) when the request fails outright', async () => {
    submitLead.mockResolvedValue({ ok: false });
    renderWithLocale(<ContactForm />);
    fill(t.nameLabel, 'Anna');
    fill(t.phoneLabel, '77123456');
    submit();
    expect(await screen.findByText(t.errors.submitFailed)).toBeInTheDocument();
    expect(screen.queryByText(t.successHeading)).not.toBeInTheDocument();
  });
});
