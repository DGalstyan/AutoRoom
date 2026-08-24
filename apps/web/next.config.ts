import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't scatter generated AGENTS.md/CLAUDE.md into the app dir — this repo
  // already has its own `.claude/skills` conventions at the root.
  agentRules: false,
};

export default nextConfig;
