'use server';

/**
 * Server Actions for the SMS-code check in front of the "Become a dealer"
 * meeting request (`apps/api`'s `POST /phone-verifications`). Same reasoning as
 * `lib/actions/leads.ts`: the call is made from this server over the internal
 * network, never from the visitor's browser, so no CORS change is needed.
 */

const base = () => process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/** Whether the API currently requires a verified phone for a meeting request. */
export async function isPhoneVerificationRequired(): Promise<boolean> {
  try {
    const res = await fetch(`${base()}/phone-verifications/config`, { cache: 'no-store' });
    if (!res.ok) return false;
    return Boolean(((await res.json()) as { required?: boolean }).required);
  } catch {
    // If the API cannot even answer this, the submit that follows will say so;
    // do not block the form on a config read.
    return false;
  }
}

export type SendCodeResult =
  { ok: true } | { ok: false; reason: 'invalid' | 'rate' | 'unavailable' };

export async function sendPhoneCode(phone: string, locale: string): Promise<SendCodeResult> {
  try {
    const res = await fetch(`${base()}/phone-verifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, locale }),
    });
    if (res.status === 202) return { ok: true };
    if (res.status === 400) return { ok: false, reason: 'invalid' };
    if (res.status === 429) return { ok: false, reason: 'rate' };
    return { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export type ConfirmCodeResult =
  { ok: true; token: string } | { ok: false; reason: 'wrong' | 'expired' | 'error' };

export async function confirmPhoneCode(phone: string, code: string): Promise<ConfirmCodeResult> {
  try {
    const res = await fetch(`${base()}/phone-verifications/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    if (res.ok) return { ok: true, token: ((await res.json()) as { token: string }).token };
    if (res.status === 400) {
      const message = (
        (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      )?.error?.message;
      return { ok: false, reason: message?.includes('not right') ? 'wrong' : 'expired' };
    }
    return { ok: false, reason: 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
