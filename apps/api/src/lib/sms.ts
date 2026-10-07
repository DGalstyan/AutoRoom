import { env, isProduction } from '../config/env';

/**
 * Outbound SMS. Same shape as `mailer.ts`: callers only ever see `sendSms`, and
 * the transport behind it is swappable — here by `SMS_PROVIDER`, in tests by
 * `setSmsTransport`.
 *
 * Nothing leaves the building until a gateway is configured: the default
 * transport logs, and refuses to in production (a verification code in a log
 * file is a live credential), so a missing provider fails loudly rather than
 * silently "succeeding".
 */

export interface Sms {
  /** E.164, e.g. `+37494077757`. */
  to: string;
  text: string;
}

export interface SmsTransport {
  send(sms: Sms): Promise<void>;
}

/** Thrown when no real gateway is configured; routes map it to 503. */
export class SmsNotConfiguredError extends Error {
  constructor() {
    super('SMS gateway is not configured');
    this.name = 'SmsNotConfiguredError';
  }
}

const consoleTransport: SmsTransport = {
  async send(sms) {
    if (isProduction) throw new SmsNotConfiguredError();
    console.log('\n──────── sms (console transport) ────────');
    console.log(`to:   ${sms.to}`);
    console.log(sms.text);
    console.log('─────────────────────────────────────────\n');
  },
};

const httpTransport: SmsTransport = {
  async send(sms) {
    if (!env.SMS_HTTP_URL) throw new SmsNotConfiguredError();
    const response = await fetch(env.SMS_HTTP_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.SMS_HTTP_TOKEN ? { authorization: `Bearer ${env.SMS_HTTP_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to: sms.to, text: sms.text, sender: env.SMS_SENDER }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`SMS gateway answered ${response.status}`);
  },
};

let transport: SmsTransport = env.SMS_PROVIDER === 'http' ? httpTransport : consoleTransport;

/** Swap the transport — used by tests and, later, by provider-specific wiring. */
export function setSmsTransport(next: SmsTransport) {
  transport = next;
}

export function sendSms(sms: Sms): Promise<void> {
  return transport.send(sms);
}

/** Whether a real gateway is wired — what "phone verification can be required" depends on. */
export function smsIsConfigured(): boolean {
  return env.SMS_PROVIDER === 'http' && Boolean(env.SMS_HTTP_URL);
}
