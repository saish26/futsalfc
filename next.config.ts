import type { NextConfig } from "next";

// Set NEXT_PUBLIC_API_BASE_URL to "/backend" to reach the API through this rewrite
// instead of calling it directly from the browser.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:8080";

console.log("[config] CLIENT_ID seen as:", JSON.stringify(process.env.CLIENT_ID));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Only NEXT_PUBLIC_* vars reach browser code on their own; listing CLIENT_ID here
  // inlines it into the bundle at build time so the Google button can read it.
  env: {
    CLIENT_ID: process.env.CLIENT_ID ?? "",
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
