'use server';

/**
 * Server Action wrapping `POST /leads` (`apps/api/src/routes/leads.ts`).
 *
 * Every caller of this (`UniversalPopup`, `QuizPopup`, `ContactForm`) is a
 * Client Component, so without this file the submission would have to be a
 * `fetch` straight from the visitor's browser to the API's public origin —
 * a genuinely cross-origin request needing `CORS_ORIGINS` opened for the
 * public site, a production `.env` this codebase has no way to change.
 * Routing it through a Server Action instead means the actual network call
 * happens on the Next.js server, over the same trusted internal-network
 * path (`API_INTERNAL_URL`) every other fetch on this site already uses —
 * the browser never talks to the API directly, so no CORS change is needed
 * anywhere. `'use server'` makes this callable directly from a Client
 * Component despite running only on the server.
 */

import type { LeadPayload } from '@/lib/leads';

export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean }> {
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
        topic: answers.topic,
        interest: answers.interest,
        budget: answers.budget,
        financing: answers.financing,
        timing: answers.timing,
        channel: answers.channel,
        color: answers.color,
        comment: answers.comment,
        carName: hidden.car?.name,
        carVin: hidden.car?.vin,
        sourcePage: hidden.sourcePage,
        sourceCta: hidden.sourceCta,
        locale: hidden.locale,
        device: hidden.device,
        quizAnswers: hidden.quizAnswers,
      }),
    });
    return { ok: res.ok };
  } catch {
    // Network error, API not running, etc. — the caller shows its own
    // success screen regardless (see `UniversalPopup`'s TODO on retry/error
    // surfacing); at minimum this never throws into the UI.
    return { ok: false };
  }
}
