'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';
import { PortalChangePasswordForm } from '@/components/partners/portal/PortalChangePasswordForm';
import { PortalDashboard } from '@/components/partners/portal/PortalDashboard';

/**
 * Gate for `/partners/portal/dashboard` — the public site's analogue of
 * `apps/admin/src/auth/ProtectedRoute.tsx`.
 *
 * While the session is being restored from the refresh cookie the answer is
 * genuinely unknown, so this renders a spinner rather than bouncing to the
 * login screen — otherwise every reload would flash it at an already
 * signed-in dealer. A system-issued (partner-invite) password renders
 * `PortalChangePasswordForm` here instead of the dashboard — one choke
 * point, so nothing downstream has to remember to check
 * `mustChangePassword` itself.
 */
export function PortalGate() {
  const { status, identity } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/partners/portal');
  }, [status, router]);

  if (status === 'loading' || status === 'anonymous') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-neutral-500 border-t-ink"
          aria-hidden
        />
      </div>
    );
  }

  if (identity?.mustChangePassword) return <PortalChangePasswordForm />;

  return <PortalDashboard />;
}
