import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["@playwright/test"],
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
      {
        source: "/api/health",
        destination: `${apiProxyTarget}/health`,
      },
    ];
  },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      config.externals = [...(config.externals ?? []), "@playwright/test"];
    }
    return config;
  },
};

export default nextConfig;
