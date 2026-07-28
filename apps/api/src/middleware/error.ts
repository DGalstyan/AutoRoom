import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, type ApiErrorBody } from '../lib/errors';
import { isProduction } from '../config/env';

/** Terminal 404 — anything that reached the end of the stack matched no route. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorBody = {
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  };
  res.status(404).json(body);
};

/**
 * Single error translator. Express 5 forwards rejected promises here on its own,
 * so route handlers can be plain `async` functions with no try/catch wrapper.
 *
 * Anything unrecognised becomes a generic 500: an unexpected error's message can
 * carry connection strings or row contents, so it is logged, never returned.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json(error.toBody());
    return;
  }

  if (error instanceof ZodError) {
    const body: ApiErrorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
    res.status(400).json(body);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 unique violation, P2025 record not found — the two that map cleanly
    // onto HTTP. Everything else is a programming error and stays a 500.
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined)?.join(', ');
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: target ? `A record with this ${target} already exists` : 'Record already exists',
        },
      } satisfies ApiErrorBody);
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      } satisfies ApiErrorBody);
      return;
    }
  }

  console.error('[api] unhandled error', error);

  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
      ...(isProduction ? {} : { details: error instanceof Error ? error.message : String(error) }),
    },
  };
  res.status(500).json(body);
};
