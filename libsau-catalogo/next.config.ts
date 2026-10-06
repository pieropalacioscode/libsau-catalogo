import type { NextConfig } from "next";

// Hosts permitidos para imágenes de producto (separados por coma).
const imageHosts = (process.env.IMAGE_HOSTS ?? "img.docentesmart.com,dnieve.kelpad.com")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Genera un servidor mínimo en .next/standalone para el contenedor del VPS.
  output: "standalone",
  // @ts-ignore - Evita bloqueo de tipos en Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Las portadas ya son AVIF livianos servidos por Cloudflare R2:
    // no se reoptimizan en el servidor (ahorra CPU del VPS).
    unoptimized: true,
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;