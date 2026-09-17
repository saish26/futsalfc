import type { NextConfig } from "next";

// The Go API has no CORS middleware, so the browser talks to Next at /backend
// and Next forwards to the API server-side.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
