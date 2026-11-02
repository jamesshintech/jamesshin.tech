import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
