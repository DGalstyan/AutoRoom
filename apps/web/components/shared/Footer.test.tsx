import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/shared/Footer';
import { messages } from '@/lib/messages';
import { BRANCHES } from '@/lib/data/branches';

// `FooterCta` (the "Let's Chat"-style button) calls `useLeadWidgets` — stub it
// the same way Header's suite does, for the same reason (isolate from the
// real popups' dependency tree).
vi.mock('@/components/shared/LeadWidgetProvider', () => ({
  useLeadWidgets: () => ({ openUniversal: vi.fn(), openQuiz: vi.fn(), isAnyOpen: false }),
}));

describe('Footer', () => {
  it("renders the site's real logo mark by default, not a placeholder glyph", () => {
    render(<Footer />);
    const img = screen.getByAltText(messages.common.brand);
    expect(img).toHaveAttribute('src', '/brand/logo-mark.svg');
  });

  it('renders the admin-uploaded logo once one exists, matching Header', () => {
    render(
      <Footer logo={{ logoLightUrl: 'https://cdn.example.com/logo.png', logoDarkUrl: null }} />,
    );
    expect(screen.getByAltText(messages.common.brand)).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png',
    );
  });

  it('links the logo home', () => {
    render(<Footer />);
    // The footer's nav-links list also renders a "home" link with the same
    // accessible name, so `getByRole` would be ambiguous here — walk up from
    // the logo image itself instead of matching by name.
    const logoLink = screen.getByAltText(messages.common.brand).closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the primary contact email and first branch phone as click-to-contact links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /hello@autoroom\.co/ })).toHaveAttribute(
      'href',
      'mailto:hello@autoroom.co',
    );
    // Built as a plain-text matcher, not `new RegExp(phone)` — the phone
    // string starts with `+`, which is not valid regex syntax on its own.
    expect(
      screen.getByRole('link', { name: (name) => name.includes(BRANCHES[0].phone) }),
    ).toHaveAttribute('href', expect.stringContaining('tel:'));
  });

  it('renders every site nav link', () => {
    render(<Footer />);
    const expectedHrefs = ['/', '/china', '/usa', '/offers', '/partners', '/about', '/contact'];
    for (const href of expectedHrefs) {
      expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === href)).toBe(
        true,
      );
    }
  });

  it('shows the copyright row', () => {
    render(<Footer />);
    expect(screen.getByText(messages.common.footer.cookiePolicy)).toBeInTheDocument();
    expect(screen.getByText(messages.common.footer.privacyPolicy)).toBeInTheDocument();
  });
});
