import { PortalAuthProvider } from '@/components/partners/portal/PortalAuthProvider';

/**
 * Shared session for both `/partners/portal` (sign-in) and
 * `/partners/portal/dashboard` (the authed view) — one provider so signing
 * in on the first and landing on the second share the same in-memory access
 * token instead of each page resuming its own session from the refresh
 * cookie.
 */
export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
