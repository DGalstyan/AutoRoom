import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { carsRouter } from './routes/cars';
import { partnersRouter } from './routes/partners';
import { rolesRouter } from './routes/roles';
import { settingsRouter } from './routes/settings';
import { uploadsRouter, UPLOAD_DIR } from './routes/uploads';
import { usersRouter } from './routes/users';
import { errorHandler, notFoundHandler } from './middleware/error';

/**
 * Express application factory. Kept separate from `server.ts` so tests can build
 * an app without binding a port.
 *
 * Order is the contract: security headers → CORS → body/cookie parsing →
 * routes → 404 → error translation. Authentication and permission checks are
 * mounted per route rather than globally, because `/health` and the public
 * lead-submission endpoint (Phase C) must stay open.
 */
export function createApp(): Express {
  const app = express();

  // Behind a proxy in production, so rate limiting and secure cookies (A1) see
  // the real client IP and protocol rather than the load balancer's.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      // Required for the httpOnly refresh cookie A1 introduces.
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // Needed before the auth routes: the refresh and CSRF cookies are read from
  // `req.cookies`.
  app.use(cookieParser());

  // Uploaded files. `crossOriginResourcePolicy` is relaxed for this path only:
  // helmet's default `same-origin` would stop the admin, on a different port,
  // from rendering an image it just uploaded.
  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      maxAge: '1y',
      index: false,
      setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

  app.use(healthRouter);
  app.use(authRouter);
  app.use(carsRouter);
  app.use(partnersRouter);
  app.use(rolesRouter);
  app.use(settingsRouter);
  app.use(uploadsRouter);
  app.use(usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
