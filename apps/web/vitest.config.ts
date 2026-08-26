import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Component/unit tests for the Next.js App Router frontend — plain
 * `next/link`, `next/image`, and Server/Client Components rendered with
 * React Testing Library, not `next dev`'s real router. `apps/api`'s
 * `vitest.config.ts` runs real integration tests against Postgres for a
 * reason explained there; this suite is deliberately the opposite kind
 * (isolated, jsdom, no network) since these are UI components, not routes
 * with permission logic to verify against real data.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors tsconfig's `"@/*": ["./*"]` so component imports resolve the
      // same way they do under `next build`.
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
});
