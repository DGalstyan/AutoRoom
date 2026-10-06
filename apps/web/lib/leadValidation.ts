import { isValidArmenianPhone } from '@/lib/phone';

/**
 * Client-side mirror of the API's lead rules (`apps/api/src/routes/leads.ts`):
 * a name is required and must contain a letter; a phone is required and must
 * be a complete number. The server enforces the same rules — this only gives
 * the visitor instant feedback.
 */
export function isValidLeadName(name: string): boolean {
  return /\p{L}/u.test(name.trim());
}

export function isValidLeadPhone(formattedPhone: string): boolean {
  return isValidArmenianPhone(formattedPhone);
}
