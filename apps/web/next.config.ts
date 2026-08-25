import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't scatter generated AGENTS.md/CLAUDE.md into the app dir — this repo
  // already has its own `.claude/skills` conventions at the root.
  agentRules: false,
  images: {
    remotePatterns: [
      // Car photos uploaded through the admin panel (apps/api's uploads
      // route), served from PUBLIC_API_URL. Production is admin.autoroom.am;
      // localhost:4000 covers local dev against a real apps/api.
      { protocol: 'https', hostname: 'admin.autoroom.am', pathname: '/api/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
