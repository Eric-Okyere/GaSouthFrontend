import type { NextConfig } from "next";

// The backend (Express API) is a separate service. Rather than making the
// browser call it cross-origin (CORS + cross-site cookie complexity), the
// Next.js server proxies /api/* to it, so the browser only ever talks to
// this app's own origin — see README "Architecture" for why.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
