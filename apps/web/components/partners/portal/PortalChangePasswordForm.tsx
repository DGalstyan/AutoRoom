'use client';

import { useState } from 'react';
import { useMessages } from '@/components/shared/LocaleProvider';
import { errorMessage } from '@/lib/portal/api';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';

const FIELD_CLASSES =
  'h-[72px] w-full rounded-pill bg-neutral-25 px-6 text-[16px] leading-6 text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent';
const LABEL_CLASSES = 'mb-2 block text-[16px] font-medium leading-5 text-neutral-800';

/**
 * Gate rendered in place of the dashboard while `identity.mustChangePassword`
 * is true — always the case right after admin issues a partner a portal
 * login (`POST /partners/:id/account`), which hands over a one-time
 * temporary password. Same choke-point idea as
 * `apps/admin/src/pages/ChangePasswordPage.tsx`: nothing downstream has to
 * remember to check this itself.
 */
export function PortalChangePasswordForm() {
  const t = useMessages().partners.portal.changePassword;
  const { api, refreshIdentity } = usePortalAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      await refreshIdentity();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[480px] items-center px-4 py-32 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-[48px] bg-white p-8 shadow-card sm:p-12"
        noValidate
      >
        <h1 className="font-display text-home-h2 font-light text-ink">{t.heading}</h1>
        <p className="mt-2 text-body text-neutral-700">{t.text}</p>

        <div className="mt-8 flex flex-col gap-6">
          <div>
            <label htmlFor="portal-current-password" className={LABEL_CLASSES}>
              {t.currentLabel}
            </label>
            <input
              id="portal-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>

          <div>
            <label htmlFor="portal-new-password" className={LABEL_CLASSES}>
              {t.newLabel}
            </label>
            <input
              id="portal-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>

          {error && (
            <p role="alert" className="text-small text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[60px] w-full shrink-0 items-center justify-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-5 text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
