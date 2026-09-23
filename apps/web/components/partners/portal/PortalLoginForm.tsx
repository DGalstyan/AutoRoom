'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useMessages } from '@/components/shared/LocaleProvider';
import { errorMessage } from '@/lib/portal/api';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';
import { useBookingPopup } from '@/components/partners/PartnersBookingProvider';

/** Same field/label styling as the Contact page's static form (`ContactForm.tsx`) — the one other non-popup form on the site. */
const FIELD_CLASSES =
  'h-[72px] w-full rounded-pill bg-neutral-25 px-6 text-[16px] leading-6 text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent';
const LABEL_CLASSES = 'mb-2 block text-[16px] font-medium leading-5 text-neutral-800';

/**
 * `/partners/portal` — the dealer/partner sign-in screen.
 *
 * No Figma mockup covers a login screen: node 378:5675 ("Dealers portal",
 * Figma file 9Lq4XpWusTJj1VnM6laAZr) jumps straight from the marketing page
 * to the authenticated dashboard. Built to match the site's own established
 * form pattern instead (`ContactForm.tsx`'s field styling, the gold pill
 * submit button, `rounded-[48px]` card) rather than inventing a new one.
 */
export function PortalLoginForm() {
  const t = useMessages().partners.portal.login;
  const { status, signIn } = usePortalAuth();
  const router = useRouter();
  const { open: openBookingPopup } = useBookingPopup();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (session resumed from the refresh cookie, or just
  // signed in) — the login screen has nothing left to do here.
  useEffect(() => {
    if (status === 'authenticated') router.replace('/partners/portal/dashboard');
  }, [status, router]);

  const emailError = touched && email.trim().length === 0;
  const passwordError = touched && password.length === 0;
  const isValid = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isValid) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/partners/portal/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-neutral-500 border-t-ink"
          aria-hidden
        />
      </div>
    );
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
            <label htmlFor="portal-email" className={LABEL_CLASSES}>
              {t.emailLabel}
            </label>
            <input
              id="portal-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={emailError}
              aria-describedby={emailError ? 'portal-email-error' : undefined}
              placeholder={t.emailPlaceholder}
              className={FIELD_CLASSES}
            />
            {emailError && (
              <p id="portal-email-error" className="mt-1 text-small text-accent">
                {t.errors.emailRequired}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="portal-password" className={LABEL_CLASSES}>
              {t.passwordLabel}
            </label>
            <input
              id="portal-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={passwordError}
              aria-describedby={passwordError ? 'portal-password-error' : undefined}
              placeholder={t.passwordPlaceholder}
              className={FIELD_CLASSES}
            />
            {passwordError && (
              <p id="portal-password-error" className="mt-1 text-small text-accent">
                {t.errors.passwordRequired}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-small text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[60px] w-full shrink-0 items-center justify-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-5 text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              t.submitting
            ) : (
              <>
                {t.submit}
                <ArrowUpRightIcon className="size-5" />
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-small text-neutral-700">
          {t.notPartner}{' '}
          <button
            type="button"
            onClick={() => openBookingPopup('partners-portal-login')}
            className="font-medium text-ink underline underline-offset-2"
          >
            {t.becomePartner}
          </button>
        </p>
      </form>
    </div>
  );
}
