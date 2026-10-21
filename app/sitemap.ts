import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/types/supabase";
import { getTodosLosProductoIds } from "@/lib/supabase/queries";
import { getSlugsPaquetes } from "@/lib/paquetes/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ids, slugs] = await Promise.all([getTodosLosProductoIds(), getSlugsPaquetes()]);

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/cotizar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/catalogo/hot-sales`, changeFrequency: "weekly", priority: 0.8 },
    ...CATEGORIAS.map(({ slug }) => ({
      url: `${SITE_URL}/catalogo/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const productos: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/producto/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const paquetes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/paquete/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...estaticas, ...paquetes, ...productos];
}
