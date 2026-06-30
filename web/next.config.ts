import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable SW in dev: Serwist requires webpack, not Turbopack
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/concepts", destination: "/emoji", permanent: true },
      { source: "/concepts/:path*", destination: "/emoji/:path*", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
