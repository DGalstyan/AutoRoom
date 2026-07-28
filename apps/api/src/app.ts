import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { errorHandler, notFoundHandler } from './middleware/error';

/**
 * Express application factory. Kept separate from `server.ts` so tests can build
 * an app without binding a port.
 *
 * A1 adds cookie parsing, CSRF and the auth routes; A2 mounts the RBAC
 * middleware in front of the admin routers. The order below is the contract
 * those steps slot into: security headers → CORS → body parsing → routes →
 * 404 → error translation.
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

  app.use(healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
