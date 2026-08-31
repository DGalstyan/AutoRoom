import type { Metadata } from 'next';
import { Inter, Noto_Sans_Armenian, Sora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { LeadWidgetProvider } from '@/components/shared/LeadWidgetProvider';
import { LocaleProvider } from '@/components/shared/LocaleProvider';
import { getBrandingLogos } from '@/lib/branding';
import { getContacts } from '@/lib/contacts';
import { getServerMessages } from '@/lib/i18n';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// Neither Sora nor Inter has Armenian glyph coverage — this is the fallback
// that actually renders Armenian text; see design-tokens.md's font stack.
const notoSansArmenian = Noto_Sans_Armenian({
  variable: '--font-noto-am',
  subsets: ['armenian'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AvtoRoom — Ավտոմեքենաների ներմուծում ԱՄՆ-ից և Չինաստանից',
  description:
    'Ներմուծում ենք ավտոմեքենաներ ԱՄՆ-ից, Չինաստանից, Եվրոպայից և այլ միջազգային շուկաներից։',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side only: never throws (see `getBrandingLogos`/`getContacts`),
  // so an unreachable API at build/render time still yields a normal page
  // with `BrandLogo`'s bundled-default fallback and an empty contacts block
  // rather than a broken build.
  const logo = await getBrandingLogos();
  const contacts = await getContacts();
  const { locale, messages, enabledLocales } = await getServerMessages();

  return (
    <html
      lang={locale}
      className={`${sora.variable} ${inter.variable} ${notoSansArmenian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface-light font-body text-body text-ink">
        <LocaleProvider locale={locale} messages={messages} enabledLocales={enabledLocales}>
          <LeadWidgetProvider>
            <Header logo={logo} />
            <main className="flex-1">{children}</main>
            <Footer logo={logo} contacts={contacts} />
            {/* StickyCta removed for now, per request — component untouched,
                just not mounted here. Re-add <StickyCta /> to bring it back. */}
          </LeadWidgetProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
