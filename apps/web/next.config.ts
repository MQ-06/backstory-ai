import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["@playwright/test"],
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.externals = [...(config.externals ?? []), "@playwright/test"];
    }
    return config;
  },
};

export default nextConfig;
