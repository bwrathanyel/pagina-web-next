import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/types/supabase";
import { getTodosLosProductoIds } from "@/lib/supabase/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";
const TIPOS_COTIZACION = ["fullday", "hospedaje", "boleteria", "paquete"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await getTodosLosProductoIds();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/cotizador-personalizado`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/catalogo/hot-sales`, changeFrequency: "weekly", priority: 0.8 },
    ...CATEGORIAS.map(({ slug }) => ({
      url: `${SITE_URL}/catalogo/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...TIPOS_COTIZACION.map((tipo) => ({
      url: `${SITE_URL}/cotizar/${tipo}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const productos: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/producto/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...estaticas, ...productos];
}
