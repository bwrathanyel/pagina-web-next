import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // El optimizador de imágenes de Next no corre en Workers (lo hacía el
    // plugin de Netlify) -- sin esto, next/image intentaría pasar por
    // /_next/image y fallaría en producción. remotePatterns queda igual,
    // documenta el origen permitido aunque quede inerte con unoptimized.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "begbjhrdbsqftbbleecb.supabase.co",
        pathname: "/storage/v1/object/public/tarifario-fotos/**",
      },
    ],
  },
};

export default nextConfig;

// Habilita el contexto de Cloudflare (bindings de R2/D1/DO) durante
// `next dev`, para poder probar localmente antes de desplegar.
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
