import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  clearAuthCookies,
  generateCsrfToken,
  setCsrfCookie,
  setRefreshCookie,
} from '../lib/cookies';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../lib/tokens';
import { unauthorized } from '../lib/errors';

/**
 * Refresh-session lifecycle: issue, rotate, revoke.
 *
 * Rotation is the security property worth understanding. Every refresh burns
 * the presented token and hands back a new one, so a stolen token is only good
 * until the legitimate client next refreshes. When a token that has *already*
 * been rotated is presented, that is the signature of a replay — the real
 * client and the thief now both hold descendants of the same grant — so the
 * entire family is revoked and both are forced to log in again.
 */

export interface IssuedSession {
  accessToken: string;
  /** Seconds until the access token expires, for the client's refresh timer. */
  expiresIn: number;
}

function accessTokenLifetimeSeconds(token: string): number {
  const [, payload] = token.split('.');
  if (!payload) return 0;
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number };
  return decoded.exp ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 0;
}

export async function issueSession(
  user: { id: string; role: { key: string } | null },
  req: Request,
  res: Response,
): Promise<IssuedSession> {
  const refreshToken = generateRefreshToken();
  const expiresAt = refreshTokenExpiry();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: req.get('user-agent')?.slice(0, 255),
      ip: req.ip,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role?.key ?? '' });

  setRefreshCookie(res, refreshToken, expiresAt);
  setCsrfCookie(res, generateCsrfToken(), expiresAt);

  return { accessToken, expiresIn: accessTokenLifetimeSeconds(accessToken) };
}

export async function rotateSession(
  presentedToken: string,
  req: Request,
  res: Response,
): Promise<IssuedSession> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    include: { user: { include: { role: true } } },
  });

  if (!stored) {
    clearAuthCookies(res);
    throw unauthorized('Invalid refresh token');
  }

  if (stored.revokedAt) {
    // Replay of a rotated token: assume compromise and kill every session this
    // user has, rather than only the one presented.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    clearAuthCookies(res);
    throw unauthorized('Refresh token has already been used. All sessions were revoked.');
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    clearAuthCookies(res);
    throw unauthorized('Refresh token expired');
  }

  const session = await issueSession(stored.user, req, res);

  const successor = await prisma.refreshToken.findFirst({
    where: { userId: stored.userId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedById: successor?.id },
  });

  return session;
}

export async function revokeSession(presentedToken: string | undefined, res: Response) {
  if (presentedToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(presentedToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearAuthCookies(res);
}

/** Used after a password reset — every existing session must stop working. */
export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
