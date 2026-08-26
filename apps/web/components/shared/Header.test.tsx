import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/shared/Header';
import { messages } from '@/lib/messages';

const nav = messages.common.nav;

// Header only needs `openUniversal`/`openQuiz` from the lead-widget context —
// stubbing it isolates this suite from `LeadWidgetProvider`'s real popups
// (which pull in `next/navigation`'s router context and their own heavy
// dependency trees) while still asserting Header wires the CTA correctly.
const openUniversal = vi.fn();
vi.mock('@/components/shared/LeadWidgetProvider', () => ({
  useLeadWidgets: () => ({ openUniversal, openQuiz: vi.fn(), isAnyOpen: false }),
}));

const EXPECTED_NAV_HREFS = [
  '/china',
  '/usa',
  '/offers',
  '/partners',
  '/blog',
  '/partners/portal',
  '/about',
  '/contact',
];

describe('Header', () => {
  it('renders the home logo link', () => {
    render(<Header />);
    const homeLink = screen.getByRole('link', { name: nav.home });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByAltText(messages.common.brand)).toBeInTheDocument();
  });

  it("renders the site's real logo mark by default, not admin-upload-only", () => {
    render(<Header />);
    expect(screen.getByAltText(messages.common.brand)).toHaveAttribute(
      'src',
      '/brand/logo-mark.svg',
    );
  });

  it('renders an admin-uploaded logo when one is provided', () => {
    render(
      <Header logo={{ logoLightUrl: 'https://cdn.example.com/logo.png', logoDarkUrl: null }} />,
    );
    expect(screen.getByAltText(messages.common.brand)).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png',
    );
  });

  it('renders every nav link with its expected href, in order', () => {
    render(<Header />);
    const navEl = screen.getByRole('navigation', { name: nav.primaryNav });
    const links = Array.from(navEl.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(EXPECTED_NAV_HREFS);
  });

  it('opens the Universal Popup from the header CTA with the right source', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole('button', { name: nav.headerCta }));
    expect(openUniversal).toHaveBeenCalledWith({ sourceCta: 'header-cta' });
  });

  it('opens the drawer and closes it again via its own toggle button', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole('button', { name: nav.menuOpen });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByRole('dialog', { name: nav.menuOpen })).toBeInTheDocument();
    // Once open, the toggle *and* the backdrop scrim both carry the
    // `menuClose` label — position 0 is the toggle (it renders first in the
    // DOM), position 1 is the scrim (only mounted while the drawer is open).
    const [closeToggle] = screen.getAllByRole('button', { name: nav.menuClose });
    expect(closeToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(closeToggle);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the drawer by clicking the backdrop scrim', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole('button', { name: nav.menuOpen }));
    const [, scrim] = screen.getAllByRole('button', { name: nav.menuClose });
    await user.click(scrim);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the drawer on Escape and restores focus to the toggle button', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole('button', { name: nav.menuOpen });
    await user.click(toggle);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
