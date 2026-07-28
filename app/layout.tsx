import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Armenian, Sora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCta } from '@/components/layout/StickyCta';
import { LeadWidgetProvider } from '@/components/lead/LeadWidgetProvider';
import { CompareProvider } from '@/components/compare/CompareProvider';
import { CompareTool } from '@/components/shared/CompareTool';
import { t } from '@/lib/i18n';

/**
 * Fonts. Sora (display) and Inter (body) carry no Armenian glyphs, so
 * Noto Sans Armenian sits right behind them in the family stack and picks up
 * every Armenian character. Verify new headings with real Armenian strings.
 */
const display = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const armenian = Noto_Sans_Armenian({
  subsets: ['armenian'],
  variable: '--font-armenian',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `AutoRoom — ${t('home.title')}`,
    template: '%s | AutoRoom',
  },
  description: t('home.subtitle'),
};

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy" className={`${display.variable} ${body.variable} ${armenian.variable}`}>
      <body className="flex min-h-screen flex-col">
        <LeadWidgetProvider>
          <CompareProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <StickyCta />
            <CompareTool />
          </CompareProvider>
        </LeadWidgetProvider>
      </body>
    </html>
  );
}
