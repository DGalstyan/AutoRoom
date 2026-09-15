'use server';

/**
 * Server Action wrapping `POST /leads` for the "Become a dealer"
 * meeting-booking popup only. Deliberately separate from `submitLead`
 * (`lib/actions/leads.ts`): that one always resolves `{ ok: false }` on any
 * failure and the caller shows its success screen regardless (fine for a
 * plain lead — there's nothing to retry differently). This form's failures
 * are not all equal: a `409` means the chosen slot was just taken by
 * someone else and the visitor needs to pick another time, which is a
 * different UI state than "something went wrong, try again" — so this
 * reports which one happened instead of swallowing it.
 */

import type { LeadHiddenContext } from '@/lib/leads';

/** Mirrors `apps/api`'s `MeetingFormat` enum — `apps/web` has no dependency
 * on `@autoroom/api/client` (that alias is `apps/admin`-only), so this is
 * kept as its own small literal union rather than importing it. */
export type MeetingFormat = 'ONLINE' | 'OFFICE' | 'OTHER';

export interface PartnerLeadAnswers {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  activityType?: string;
  comment?: string;
  meetingFormat: MeetingFormat;
  meetingSlotId?: string;
  /** Only sent when no real slot exists yet for the picked day/time. */
  meetingAt?: string;
  meetingBranchId?: string;
  meetingAddress?: string;
}

export interface PartnerLeadPayload {
  answers: PartnerLeadAnswers;
  hidden: LeadHiddenContext;
}

export type PartnerLeadResult = { ok: true } | { ok: false; reason: 'conflict' | 'error' };

export async function submitPartnerLead(payload: PartnerLeadPayload): Promise<PartnerLeadResult> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  const { answers, hidden } = payload;

  try {
    const res = await fetch(`${base}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: answers.name,
        phone: answers.phone,
        email: answers.email,
        company: answers.company,
        activityType: answers.activityType,
        comment: answers.comment,
        meetingFormat: answers.meetingFormat,
        meetingSlotId: answers.meetingSlotId,
        meetingAt: answers.meetingAt,
        meetingBranchId: answers.meetingBranchId,
        meetingAddress: answers.meetingAddress,
        sourcePage: hidden.sourcePage,
        sourceCta: hidden.sourceCta,
        timestamp: hidden.timestamp,
        locale: hidden.locale,
        device: hidden.device,
      }),
    });

    if (res.ok) return { ok: true };
    if (res.status === 409) return { ok: false, reason: 'conflict' };
    return { ok: false, reason: 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
