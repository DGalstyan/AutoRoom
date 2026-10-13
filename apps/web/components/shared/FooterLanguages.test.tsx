import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterLanguages } from '@/components/shared/FooterLanguages';
import { LocaleProvider } from '@/components/shared/LocaleProvider';
import { getMessagesForLocale, type Locale } from '@/lib/i18n';
import { LOCALE_LABELS } from '@/lib/localeLabels';

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
  it('lists the enabled languages with the same labels as the menu, marking the current one', () => {
    renderWith('hy', ['hy', 'en', 'ru']);
    const buttons = screen.getAllByRole('button');
    // The design's order: En / Arm / Ru.
    expect(buttons.map((b) => b.textContent)).toEqual([
      LOCALE_LABELS.en,
      LOCALE_LABELS.hy,
      LOCALE_LABELS.ru,
    ]);
    expect(screen.getByRole('button', { name: LOCALE_LABELS.hy })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: LOCALE_LABELS.en })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('offers only the languages an admin has enabled', () => {
    renderWith('hy', ['hy', 'en']);
    expect(screen.queryByRole('button', { name: LOCALE_LABELS.ru })).not.toBeInTheDocument();
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
