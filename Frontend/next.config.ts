import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRIT-07 Fix: Remove ignoreBuildErrors — fix underlying TS errors instead
  // CRIT-08 Fix: Enable React Strict Mode to catch real bugs
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
      // Supabase Storage — supports both standard and custom domains
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "supabase.com",
      },
      // Placecats placeholder
      {
        protocol: "https",
        hostname: "placecats.com",
      },
      // Backend host — serves uploaded cat/donation photos
      // Update this if your backend is hosted elsewhere
      {
        protocol: "https",
        hostname: "catcare-backend.onrender.com",
      },
    ],
  },
};

export default nextConfig;
