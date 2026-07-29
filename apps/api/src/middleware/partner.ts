import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { forbidden, unauthorized } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by `requirePartner` — the partner the signed-in account belongs to. */
      partnerId?: string;
    }
  }
}

/**
 * Gate for the partner portal.
 *
 * This is the record-level check the permission matrix cannot express. Rather
 * than granting a partner `cars:READ` — which the admin routes would honour by
 * handing over the entire catalogue — every `/portal/*` route resolves the
 * Partner attached to the signed-in account and filters by its id. There is no
 * request parameter that selects a different partner, so scoping is not
 * something a handler can forget to apply.
 *
 * An account whose partner record was deactivated stops here rather than at the
 * first empty list: "your access was withdrawn" is a different answer from "you
 * have no cars".
 */
export const requirePartner: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(unauthorized('Authentication required'));
    return;
  }

  void prisma.partner
    .findUnique({ where: { userId: req.auth.userId } })
    .then((partner) => {
      if (!partner) {
        next(forbidden('This account is not linked to a partner'));
        return;
      }
      if (!partner.active) {
        next(forbidden('This partner account has been deactivated'));
        return;
      }
      req.partnerId = partner.id;
      next();
    })
    .catch(next);
};
