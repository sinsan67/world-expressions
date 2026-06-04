import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/concepts", destination: "/emoji", permanent: true },
      { source: "/concepts/:path*", destination: "/emoji/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
