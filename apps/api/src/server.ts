import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { shrinkAllUploads } from './lib/imageShrink';
import { UPLOAD_DIR } from './routes/uploads';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on port ${env.PORT} (${env.NODE_ENV})`);
});

// Photos uploaded before uploads were resized can be tens of megabytes. Shrink them in the
// background, one at a time; files that are already small are skipped, so a restart costs nothing.
if (env.NODE_ENV === 'production') {
  void shrinkAllUploads(UPLOAD_DIR)
    .then(({ shrunk, savedBytes }) =>
      console.log(
        `[api] shrank ${shrunk} oversized upload(s), saved ${Math.round(savedBytes / 1048576)} MB`,
      ),
    )
    .catch((error) => console.error('[api] upload shrink failed', error));
}

/**
 * Close the HTTP server before the database pool so in-flight requests finish
 * instead of failing on a disconnected client mid-query.
 */
async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
