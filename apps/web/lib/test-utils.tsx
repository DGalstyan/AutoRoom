import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { LocaleProvider } from '@/components/shared/LocaleProvider';
import { getMessagesForLocale, type Locale } from '@/lib/i18n';

/**
 * Every component that reads `useMessages()`/`useLocale()` needs a
 * `<LocaleProvider>` ancestor — this is that ancestor for tests, defaulting
 * to `hy` (the site's default locale) so existing assertions written against
 * Armenian copy keep working unchanged.
 */
export function renderWithLocale(ui: ReactElement, locale: Locale = 'hy'): RenderResult {
  return render(
    <LocaleProvider
      locale={locale}
      messages={getMessagesForLocale(locale)}
      enabledLocales={[locale]}
    >
      {ui}
    </LocaleProvider>,
  );
}
