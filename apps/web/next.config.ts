import path from 'node:path';
import type { NextConfig } from 'next';

// `@autoroom/api/client`'s package.json "exports" point at its built
// `dist/client/index.js` — fine for a script that runs `npm run build
// --workspace apps/api` first, but the partner-portal Docker build (and a
// fresh local checkout) doesn't. Same fix admin's vite.config.ts already
// uses: alias straight to the dependency-free TypeScript source, so bundling
// it needs nothing but that one file. tsconfig.json's own "paths" entry
// mirrors this for type-checking; this is the bundler-side half.
//
// Turbopack (unlike Vite) infers a source file's module format from the
// nearest package.json's "type" — apps/api/package.json says "commonjs",
// which conflicts with this file's real `import`/`export` syntax and fails
// the build. `apps/api/src/client/package.json` (`{"type":"module"}`)
// overrides that for just this subtree; apps/api's own `tsc` build ignores
// it (its tsconfig uses classic "node" module resolution, which doesn't
// consult package.json "type" at all), so the compiled dist output — and
// apps/admin, which aliases straight to this same source in Vite — are
// unaffected.
const apiClientSourceRelative = '../api/src/client/index.ts';
const apiClientSourceAbsolute = path.resolve(__dirname, apiClientSourceRelative);

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't scatter generated AGENTS.md/CLAUDE.md into the app dir — this repo
  // already has its own `.claude/skills` conventions at the root.
  agentRules: false,
  turbopack: {
    // Wants a path relative to this config file, not an absolute one — an
    // absolute path here gets misread as a root-relative import ("server
    // relative imports are not implemented yet").
    resolveAlias: {
      '@autoroom/api/client': apiClientSourceRelative,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@autoroom/api/client': apiClientSourceAbsolute,
    };
    return config;
  },
  images: {
    remotePatterns: [
      // Car photos uploaded through the admin panel (apps/api's uploads
      // route), served from PUBLIC_API_URL. Production is admin.autoroom.am;
      // localhost:4000 covers local dev against a real apps/api.
      { protocol: 'https', hostname: 'admin.autoroom.am', pathname: '/api/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
    ],
    // Next 16's SSRF guard otherwise refuses to optimize anything hosted on
    // `localhost` (it resolves to a private IP), which is exactly what the
    // `localhost:4000` pattern above is for — every admin-uploaded photo
    // (team, cars, gallery) would 400 in local dev without this. No effect
    // in production: `admin.autoroom.am` resolves publicly, never locally.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
