import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterLanguages } from '@/components/shared/FooterLanguages';
import { LocaleProvider } from '@/components/shared/LocaleProvider';
import { getMessagesForLocale, type Locale } from '@/lib/i18n';

function renderWith(locale: Locale, enabled: Locale[]) {
  return render(
    <LocaleProvider
      locale={locale}
      messages={getMessagesForLocale(locale)}
      enabledLocales={enabled}
    >
      <FooterLanguages heading="Languages" />
    </LocaleProvider>,
  );
}

describe('FooterLanguages', () => {
  it('lists the enabled languages as En / Arm / Ru, marking the current one', () => {
    renderWith('hy', ['hy', 'en', 'ru']);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['En', 'Arm', 'Ru']);
    expect(screen.getByRole('button', { name: 'Arm' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'En' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('offers only the languages an admin has enabled', () => {
    renderWith('hy', ['hy', 'en']);
    expect(screen.queryByRole('button', { name: 'Ru' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('renders nothing when there is only one language', () => {
    const { container } = renderWith('hy', ['hy']);
    expect(container).toBeEmptyDOMElement();
  });

  it('every target is at least 44px tall', () => {
    renderWith('hy', ['hy', 'en', 'ru']);
    for (const b of screen.getAllByRole('button')) expect(b).toHaveClass('min-h-11');
  });
});
