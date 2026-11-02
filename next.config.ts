import type { NextConfig } from "next";

// Sent with every response. The site embeds nothing and asks for no device
// access; its only inline scripts are the JSON-LD and the home page's pin
// gate, so a script CSP would need 'unsafe-inline' and is left out.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // An essay taken off the site sends its old address to the essay list, not
  // a 404. Temporary (307), so the address can be reused if it comes back.
  async redirects() {
    return [
      {
        source: "/writing/2026-w17-the-distribution-moat-in-the-ai-era",
        destination: "/writing",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
