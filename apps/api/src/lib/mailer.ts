import { isProduction } from '../config/env';

/**
 * Outbound email. No provider is configured yet, so the default transport logs
 * the message instead of sending it — which is enough for the password-reset
 * flow to be exercised end to end locally.
 *
 * TODO(client): supply an SMTP/SES/Postmark credential set, then implement a
 * transport here. Nothing outside this file needs to change.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  send(mail: Mail): Promise<void>;
}

const consoleTransport: MailTransport = {
  async send(mail) {
    // Refusing to log in production is deliberate: a reset link in a log file is
    // a live credential. Better to fail loudly than to quietly leak one.
    if (isProduction) {
      throw new Error(
        'No mail transport configured. Set one up before running in production — ' +
          'the console transport would write reset links to the logs.',
      );
    }
    console.log('\n──────── email (console transport) ────────');
    console.log(`to:      ${mail.to}`);
    console.log(`subject: ${mail.subject}`);
    console.log(mail.text);
    console.log('───────────────────────────────────────────\n');
  },
};

let transport: MailTransport = consoleTransport;

/** Swap the transport — used by tests and, later, by the real provider wiring. */
export function setMailTransport(next: MailTransport) {
  transport = next;
}

export function sendMail(mail: Mail): Promise<void> {
  return transport.send(mail);
}
