import { NextResponse } from 'next/server';
import type { LeadPayload } from '@/lib/lead';

/**
 * Lead intake stub. Every popup and form posts here through `submitLead()`.
 *
 * TODO(P7.3): forward to the CRM once the endpoint + credentials are provided.
 * Until then this validates the payload and acknowledges, so the whole funnel is
 * exercisable end-to-end without a backend.
 */

export const runtime = 'nodejs';

const PHONE_PATTERN = /^\+374\d{8}$/;

function validate(payload: Partial<LeadPayload>): string | null {
  if (typeof payload?.name !== 'string' || payload.name.trim().length === 0) {
    return 'name is required';
  }
  if (typeof payload?.phone !== 'string' || !PHONE_PATTERN.test(payload.phone)) {
    return 'phone must be a valid +374 number';
  }
  if (typeof payload?.context?.sourcePage !== 'string') {
    return 'context.sourcePage is required';
  }
  return null;
}

export async function POST(request: Request) {
  let payload: Partial<LeadPayload>;

  try {
    payload = (await request.json()) as Partial<LeadPayload>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }

  const error = validate(payload);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  // Lead bodies carry personal data — log only the routing context, never the
  // name/phone, and only outside production.
  if (process.env.NODE_ENV !== 'production') {
    console.info('[lead]', {
      sourcePage: payload.context?.sourcePage,
      sourceCta: payload.context?.sourceCta,
      car: payload.context?.car?.name,
      interest: payload.answers?.interest,
      device: payload.context?.device,
    });
  }

  return NextResponse.json({ ok: true, id: crypto.randomUUID() }, { status: 201 });
}
