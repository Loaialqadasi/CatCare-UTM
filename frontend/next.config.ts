import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // CRIT-07 Fix: Remove ignoreBuildErrors — fix underlying TS errors instead
  // CRIT-08 Fix: Enable React Strict Mode to catch real bugs
  reactStrictMode: true,
};

export default nextConfig;
