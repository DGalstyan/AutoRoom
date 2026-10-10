import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * Forwards a new lead to an external CRM, if `LEAD_WEBHOOK_URL` is set. The lead is already saved
 * in this system's own CRM (the admin Leads screen) before this runs, so a failure here never
 * loses a lead or fails the visitor's request: it is logged and dropped.
 *
 * The body carries everything the sales team needs to act on it, grouped: who (`contact`), which
 * vehicle (`vehicle`: id, VIN, lot, link, arrival day) and where it came from (`context`: page,
 * CTA, language, device, client and server timestamps). When `LEAD_WEBHOOK_SECRET` is set the raw
 * body is signed (`X-AutoRoom-Signature: sha256=<hex hmac>`) so the receiver can verify it.
 */

export interface WebhookLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  topic: string | null;
  interest: string | null;
  budget: string | null;
  financing: string | null;
  timing: string | null;
  channel: string | null;
  color: string | null;
  comment: string | null;
  company: string | null;
  carName: string | null;
  carId: string | null;
  carVin: string | null;
  carLot: string | null;
  carLink: string | null;
  carArrivalDate: Date | null;
  sourcePage: string;
  sourceCta: string;
  locale: string;
  device: string;
  submittedAt: Date | null;
  createdAt: Date;
  quizAnswersJson: unknown;
}

export function buildLeadWebhookBody(lead: WebhookLead) {
  return {
    event: 'lead.created',
    id: lead.id,
    contact: { name: lead.name, phone: lead.phone, email: lead.email, company: lead.company },
    request: {
      topic: lead.topic,
      interest: lead.interest,
      budget: lead.budget,
      financing: lead.financing,
      timing: lead.timing,
      channel: lead.channel,
      color: lead.color,
      comment: lead.comment,
      quizAnswers: lead.quizAnswersJson ?? null,
    },
    vehicle: {
      id: lead.carId,
      name: lead.carName,
      vin: lead.carVin,
      lot: lead.carLot,
      link: lead.carLink,
      arrivalDate: lead.carArrivalDate?.toISOString().slice(0, 10) ?? null,
    },
    context: {
      page: lead.sourcePage,
      cta: lead.sourceCta,
      language: lead.locale,
      device: lead.device,
      submittedAt: lead.submittedAt?.toISOString() ?? null,
      receivedAt: lead.createdAt.toISOString(),
    },
  };
}

export function signBody(body: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
}

/** Fire-and-forget; resolves to whether the CRM accepted it (false when unset, rejected or unreachable). */
export async function forwardLeadToCrm(lead: WebhookLead): Promise<boolean> {
  const url = env.LEAD_WEBHOOK_URL;
  if (!url) return false;

  const body = JSON.stringify(buildLeadWebhookBody(lead));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.LEAD_WEBHOOK_SECRET
          ? { 'X-AutoRoom-Signature': signBody(body, env.LEAD_WEBHOOK_SECRET) }
          : {}),
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[leads] CRM webhook answered ${res.status} for lead ${lead.id}`);
    return res.ok;
  } catch (error) {
    console.error(`[leads] CRM webhook failed for lead ${lead.id}:`, (error as Error).message);
    return false;
  }
}
