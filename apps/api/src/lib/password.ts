import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * Password hashing. 12 rounds is roughly 250ms on current hardware — slow
 * enough to make offline cracking expensive, fast enough that a login does not
 * feel laggy. Raise it as hardware improves; bcrypt stores the cost in the hash,
 * so old hashes keep verifying.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * The floor the API enforces, re-exported from the shared client so the admin's
 * forms and the server validate against one number.
 *
 * It is set deliberately low so short throwaway passwords work while the panel
 * is being built. Three characters is guessable in well under a second, and the
 * only thing standing in the way is the login lockout (`LOGIN_MAX_ATTEMPTS`
 * failures, then `LOGIN_LOCKOUT_MINUTES`). Raise it before the panel is
 * reachable from the internet — length beats composition rules for real
 * entropy, so a larger number here is worth more than any character-class rule.
 */
export { MIN_PASSWORD_LENGTH } from '../client/types';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A system-issued password for accounts the API creates on someone else's
 * behalf (partner portal invites). Random rather than memorable by design —
 * it is shown once for a staff member to hand over, and `mustChangePassword`
 * forces the partner to replace it with one of their own before it can be
 * relied on again.
 */
export function generateTemporaryPassword(): string {
  return crypto.randomBytes(15).toString('base64url');
}
