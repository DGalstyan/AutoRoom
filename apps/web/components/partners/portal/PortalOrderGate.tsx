'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';
import { PortalChangePasswordForm } from '@/components/partners/portal/PortalChangePasswordForm';
import { PortalOrderDetail } from '@/components/partners/portal/PortalOrderDetail';

/** Same gate as `PortalGate`, for `/partners/portal/orders/[id]` — see its
 * own doc comment for why the loading/anonymous split exists. */
export function PortalOrderGate({ id }: { id: string }) {
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

  return <PortalOrderDetail id={id} />;
}
