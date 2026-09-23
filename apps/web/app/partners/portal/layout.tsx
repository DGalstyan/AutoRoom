import { PortalAuthProvider } from '@/components/partners/portal/PortalAuthProvider';
import { PartnersBookingProvider } from '@/components/partners/PartnersBookingProvider';
import { Footer } from '@/components/shared/Footer';
import { getBranches } from '@/lib/branches';
import { getBrandingLogos } from '@/lib/branding';
import { getContacts } from '@/lib/contacts';

/**
 * Shared session for both `/partners/portal` (sign-in) and
 * `/partners/portal/dashboard` (the authed view) — one provider so signing
 * in on the first and landing on the second share the same in-memory access
 * token instead of each page resuming its own session from the refresh
 * cookie.
 *
 * Also carries `PartnersBookingProvider` (same one `/partners` itself uses)
 * so the login screen's "Դառնալ գործընկեր" link can open the real
 * meeting-booking popup in place, per direct user feedback, instead of just
 * linking to the marketing page and making a visitor go find the CTA again.
 */
export default async function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  const [branches, logo, contacts] = await Promise.all([
    getBranches(),
    getBrandingLogos(),
    getContacts(),
  ]);

  return (
    <PartnersBookingProvider
      branches={branches}
      footer={<Footer logo={logo} contacts={contacts} />}
    >
      <PortalAuthProvider>{children}</PortalAuthProvider>
    </PartnersBookingProvider>
  );
}
