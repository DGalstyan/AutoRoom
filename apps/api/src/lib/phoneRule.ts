import { z } from 'zod';

/** A phone number a person could actually be called on: digits with the usual `+ ( ) - .` and spaces, 8–15 digits. */
export function isPlausiblePhone(value: string): boolean {
  if (!/^[\d\s().+-]+$/.test(value) || (value.match(/\+/g) ?? []).length > 1) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= 8 && digits <= 15;
}

/** Optional phone field: empty = none, anything else must be a plausible number. */
export const optionalPhone = z
  .union([z.string().trim().max(40), z.literal(''), z.null()])
  .optional()
  .transform((value) => value || null)
  .refine((value) => value === null || isPlausiblePhone(value), {
    message: 'Enter a valid phone number, e.g. +374 94 123456',
  });
