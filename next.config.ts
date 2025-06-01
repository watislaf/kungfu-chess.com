import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export in production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true
  },
};

export default nextConfig;
