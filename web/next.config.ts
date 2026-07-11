import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable SW in dev: Serwist requires webpack, not Turbopack
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/concepts", destination: "/emoji", permanent: true },
      { source: "/concepts/:path*", destination: "/emoji/:path*", permanent: true },
      // /emojis was one letter away from /emoji (Concepts) — renamed to match its nav label "Emoji map"
      { source: "/emojis", destination: "/emoji-map", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
