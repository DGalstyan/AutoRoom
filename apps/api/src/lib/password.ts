import bcrypt from 'bcryptjs';

/**
 * Password hashing. 12 rounds is roughly 250ms on current hardware — slow
 * enough to make offline cracking expensive, fast enough that a login does not
 * feel laggy. Raise it as hardware improves; bcrypt stores the cost in the hash,
 * so old hashes keep verifying.
 */
export const BCRYPT_ROUNDS = 12;

/** The floor the API enforces. Length beats composition rules for real entropy. */
export const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
