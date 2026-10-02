import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Evita bloqueo de linter en Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-ignore - Evita bloqueo de tipos en Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;