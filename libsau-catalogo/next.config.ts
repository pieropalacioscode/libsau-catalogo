import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**", // Permite imágenes desde cualquier dominio seguro (HTTPS)
      },
      /* Si prefieres restringir a tu dominio específico de imágenes/backend:
      {
        protocol: "https",
        hostname: "api.tudominio.com",
      },
      */
    ],
  },
};

export default nextConfig;