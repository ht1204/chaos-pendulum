import type { NextConfig } from "next";

/**
 * Static-export mode for GitHub Pages. Gated behind EXPORT=1 so the normal
 * build (used by `next start` and Playwright's webServer) is unaffected.
 * Set BASE_PATH when the repository name differs from "chaos-pendulum".
 */
const isExport = process.env.EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport && {
    output: "export" as const,
    basePath: process.env.BASE_PATH ?? "/chaos-pendulum",
    images: { unoptimized: true },
  }),
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
