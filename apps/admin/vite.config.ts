import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const welcomePage = fileURLToPath(new URL('./welcome.html', import.meta.url));

/**
 * `/` is the public site's slot. That site does not exist yet, so the dev
 * server answers with a standing welcome page rather than Vite's "configured
 * with a public base URL" notice — and deliberately does not redirect to
 * `/admin`, because this origin's front door belongs to the website, not the
 * back office. Read per request so edits to `welcome.html` show on reload.
 *
 * Dev/preview only. In production the public site owns `/` and the built panel
 * is served from `/admin`.
 */
function serveWelcomePage(): Plugin {
  return {
    name: 'autoroom-welcome-page',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0];
        if (path !== '/') {
          // Bare `/admin` would 404 without the trailing slash the base needs.
          if (path === '/admin') {
            res.writeHead(302, { Location: '/admin/' });
            res.end();
            return;
          }
          next();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(readFileSync(welcomePage, 'utf8'));
      });
    },
  };
}

export default defineConfig({
  base: '/admin/',
  plugins: [react(), serveWelcomePage()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Point at the API client's *source* rather than its build output. The
      // module is dependency-free TypeScript, so Vite compiles it directly and
      // the admin no longer has to wait on `npm run build --workspace apps/api`
      // before it can start.
      '@autoroom/api/client': fileURLToPath(new URL('../api/src/client/index.ts', import.meta.url)),
    },
  },
  server: {
    // Fixed, not "next free port": the API allow-lists this exact origin for
    // credentialed CORS, so silently moving to 3001 would break sign-in.
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
