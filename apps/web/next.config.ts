import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The whole UI is Armenian; a second locale can be added later via `messages/`.
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
