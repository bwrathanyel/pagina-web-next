import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La propuesta para las posadas vivió un rato en /posadas antes de pasar a
  // /ia-planes; sin esto, cualquier link ya compartido daría 404.
  //
  // No agregar una entrada para la variante en mayúsculas: el matcheo de
  // `source` NO distingue mayúsculas, así que "/IA-Planes" matchearía también
  // "/ia-planes" y la ruta se redirigiría a sí misma en bucle.
  async redirects() {
    return [
      { source: "/posadas", destination: "/ia-planes", permanent: true },
    ];
  },
  images: {
    // El optimizador de imágenes de Next (el que corre en /_next/image) no
    // funciona en Workers -- lo hacía el plugin de Netlify. En vez de servir
    // todo a resolución completa (unoptimized:true), un loader personalizado
    // reescribe cada URL de Supabase Storage al endpoint gratis de
    // transformación de imágenes del propio proyecto (ya viene incluido,
    // sin costo extra ni Cloudflare Images), pidiendo el ancho real que cada
    // `sizes` ya declaraba pero que unoptimized ignoraba.
    loader: "custom",
    loaderFile: "./lib/supabase/imageLoader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "begbjhrdbsqftbbleecb.supabase.co",
        pathname: "/storage/v1/object/public/tarifario-fotos/**",
      },
      {
        // Worker propio con R2 detras, sirve las miniaturas sin costo de egress.
        protocol: "https",
        hostname: "fotos.destinoyeventoslotus360.com",
        pathname: "/_d/**",
      },
    ],
  },
};

export default nextConfig;

// Habilita el contexto de Cloudflare (bindings de R2/D1/DO) durante
// `next dev`, para poder probar localmente antes de desplegar.
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
