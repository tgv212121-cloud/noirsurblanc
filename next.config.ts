import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/onboarding', destination: '/onboarding-static.html' },
    ]
  },
};

export default nextConfig;
