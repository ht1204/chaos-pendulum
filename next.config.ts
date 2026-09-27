import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    // SWC-native styled-components support. NOTE: no .babelrc in this repo —
    // mixing Babel and SWC transforms is a known conflict (AGENTS.v2.md, resolved finding #4).
    styledComponents: true,
  },
};

export default nextConfig;
