import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Footer } from '@/components/shared/Footer';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';
import { getBranches } from '@/lib/branches';

const messages = getMessagesForLocale('hy');

const FILLED_CONTACTS = {
  general: {
    email: 'hello@autoroom.co',
    phones: ['+374 94 077757', '+374 77 838750'],
    b2bPhone: null,
    workingHours: '10:00–22:00',
  },
  social: {
    facebook: 'https://facebook.com/autoroom',
    instagram: 'https://instagram.com/autoroom',
    tiktok: null,
    linkedin: null,
  },
};

// `FooterCta` (the "Let's Chat"-style button) calls `useLeadWidgets` — stub it
// the same way Header's suite does, for the same reason (isolate from the
// real popups' dependency tree).
vi.mock('@/components/shared/LeadWidgetProvider', () => ({
  useLeadWidgets: () => ({ openUniversal: vi.fn(), openQuiz: vi.fn(), isAnyOpen: false }),
}));

// `Footer` is an async Server Component (it calls `getServerMessages()`,
// which reads the request's cookies via `next/headers`) — there's no request
// scope in a plain Vitest/jsdom run, so `next/headers` is stubbed out here
// and `getServerMessages` is pinned to `hy`, matching every assertion below.
// Each test calls `await Footer(props)` directly (a plain async function
// call, not JSX) to resolve the element tree before handing it to `render`.
vi.mock('@/lib/branches', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/branches')>();
  return { ...actual, getBranches: vi.fn().mockResolvedValue([]) };
});

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>();
  return {
    ...actual,
    getServerMessages: async () => ({
      locale: 'hy' as const,
      messages: actual.getMessagesForLocale('hy'),
      enabledLocales: ['hy' as const],
    }),
  };
});

describe('Footer', () => {
  it("renders the site's real logo mark by default, not a placeholder glyph", async () => {
    renderWithLocale(await Footer());
    const img = screen.getByAltText(messages.common.brand);
    expect(img).toHaveAttribute('src', '/brand/logo-mark.svg');
  });

  it('renders the admin-uploaded logo once one exists, matching Header', async () => {
    renderWithLocale(
      await Footer({
        logo: { logoLightUrl: 'https://cdn.example.com/logo.png', logoDarkUrl: null },
      }),
    );
    expect(screen.getByAltText(messages.common.brand)).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png',
    );
  });

  it('links the logo home', async () => {
    renderWithLocale(await Footer());
    const logoLink = screen.getByAltText(messages.common.brand).closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the admin-managed email and phones as click-to-contact links', async () => {
    renderWithLocale(await Footer({ contacts: FILLED_CONTACTS }));
    expect(screen.getByRole('link', { name: /hello@autoroom\.co/ })).toHaveAttribute(
      'href',
      'mailto:hello@autoroom.co',
    );
    // Built as a plain-text matcher, not `new RegExp(phone)` — the phone
    // string starts with `+`, which is not valid regex syntax on its own.
    expect(
      screen.getByRole('link', {
        name: (name) => name.includes(FILLED_CONTACTS.general.phones[0]),
      }),
    ).toHaveAttribute('href', expect.stringContaining('tel:'));
    // Every admin-managed phone is listed (the design's "Contact Us" list).
    expect(screen.getByText(FILLED_CONTACTS.general.phones[1])).toBeInTheDocument();
  });

  it('renders nothing in the contact column when no email or phone is set', async () => {
    renderWithLocale(await Footer());
    expect(screen.queryByText(messages.common.footer.contactHeading)).not.toBeInTheDocument();
  });

  it('renders only the social platforms the backend actually has a link for', async () => {
    renderWithLocale(await Footer({ contacts: FILLED_CONTACTS }));
    const facebookLink = screen.getByRole('link', { name: 'Facebook' });
    expect(facebookLink).toHaveAttribute('href', FILLED_CONTACTS.social.facebook);
    expect(facebookLink).toHaveAttribute('target', '_blank');
    expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    // tiktok/linkedin are null in the fixture — no dead links for them.
    expect(screen.queryByRole('link', { name: 'TikTok' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument();
  });

  it('renders no social links when no platform is set', async () => {
    renderWithLocale(await Footer());
    for (const name of ['Facebook', 'Instagram', 'TikTok', 'LinkedIn']) {
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
  });

  it('lists the admin-managed branch addresses under the locations heading', async () => {
    vi.mocked(getBranches).mockResolvedValueOnce([
      {
        id: 'b1',
        name: 'N1',
        city: 'Երևան',
        address: 'Սայաթ-Նովա 20',
        phone: '+374 94 077757',
        hours: '10:00–22:00',
        mapUrl: null,
        photoUrl: null,
      },
    ]);
    renderWithLocale(await Footer());
    expect(screen.getByText(messages.common.footer.branchesHeading)).toBeInTheDocument();
    expect(screen.getByText('Երևան, Սայաթ-Նովա 20')).toBeInTheDocument();
  });

  it('shows the site navigation in the design order', async () => {
    renderWithLocale(await Footer());
    const nav = screen.getByRole('navigation', { name: messages.common.nav.primaryNav });
    expect(Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      '/china',
      '/usa',
      '/partners',
      '/about',
      '/offers',
    ]);
  });

  it('shows the copyright row', async () => {
    renderWithLocale(await Footer());
    // The legal block is rendered twice (beside the socials on desktop, closing the footer on phones; CSS shows one).
    for (const link of screen.getAllByRole('link', {
      name: messages.common.footer.privacyPolicy,
    })) {
      expect(link).toHaveAttribute('href', '/privacy');
    }
    for (const link of screen.getAllByRole('link', { name: messages.common.footer.terms })) {
      expect(link).toHaveAttribute('href', '/terms');
    }
  });
});

describe('Footer messengers', () => {
  it('shows only the messengers the admin has configured, as verified deep links', async () => {
    renderWithLocale(
      await Footer({
        contacts: {
          ...FILLED_CONTACTS,
          messengers: {
            whatsapp: 'https://wa.me/37493882818',
            viber: null,
            telegram: 'https://t.me/autoroom_am',
          },
        },
      }),
    );
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/37493882818',
    );
    expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute(
      'href',
      'https://t.me/autoroom_am',
    );
    expect(screen.queryByRole('link', { name: 'Viber' })).not.toBeInTheDocument();
  });
});
