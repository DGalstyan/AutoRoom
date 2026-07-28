import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * zod validation for request parts. `admin.md` requires validation on every
 * write; this is the single helper those routes use.
 *
 * The parsed (and therefore coerced/defaulted) value replaces the raw one, so
 * handlers read `req.body` already typed and normalised. Failures throw a
 * `ZodError`, which the error middleware renders as a 400 with per-field details.
 */

type Part = 'body' | 'query' | 'params';

export function validate<S extends ZodTypeAny>(part: Part, schema: S): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // `req.query`/`req.params` are getter-only in Express 5, so assign through
    // defineProperty rather than plain mutation.
    Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
    next();
  };
}

/** Convenience aliases so routes read as `validateBody(schema)`. */
export const validateBody = <S extends ZodTypeAny>(schema: S) => validate('body', schema);
export const validateQuery = <S extends ZodTypeAny>(schema: S) => validate('query', schema);
export const validateParams = <S extends ZodTypeAny>(schema: S) => validate('params', schema);

/** Infer the validated type of a schema, for typing handlers. */
export type Validated<S extends ZodTypeAny> = z.infer<S>;
