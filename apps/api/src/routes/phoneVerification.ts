import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { phoneVerificationLimiter } from '../middleware/rateLimit';
import {
  confirmPhoneVerification,
  phoneVerificationRequired,
  startPhoneVerification,
} from '../services/phoneVerification';

export const phoneVerificationRouter = Router();

const startSchema = z.object({
  phone: z.string().trim().min(5).max(30),
  locale: z.enum(['hy', 'en', 'ru']).default('hy'),
});

const confirmSchema = z.object({
  phone: z.string().trim().min(5).max(30),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

/** Public — lets the form know whether it must show the code step at all. */
phoneVerificationRouter.get('/phone-verifications/config', (_req, res) => {
  res.json({ required: phoneVerificationRequired() });
});

phoneVerificationRouter.post(
  '/phone-verifications',
  phoneVerificationLimiter,
  validateBody(startSchema),
  async (req, res) => {
    const { phone, locale } = req.body as z.infer<typeof startSchema>;
    await startPhoneVerification(phone, locale);
    res.status(202).json({ sent: true });
  },
);

phoneVerificationRouter.post(
  '/phone-verifications/confirm',
  phoneVerificationLimiter,
  validateBody(confirmSchema),
  async (req, res) => {
    const { phone, code } = req.body as z.infer<typeof confirmSchema>;
    const token = await confirmPhoneVerification(phone, code);
    res.json({ token });
  },
);
