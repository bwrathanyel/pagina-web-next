import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/types/supabase";
import { supabaseServer } from "@/lib/supabase/server";
import { DESTINOS } from "@/lib/seo/destinos";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

// Mismo filtro que getTodosLosProductoIds / getSlugsPaquetes, pero con la fecha
// de última edición: Google y Bing la usan para decidir qué volver a rastrear.
async function productosConFecha() {
  const { data, error } = await supabaseServer()
    .from("productos")
    .select("id, updated_at")
    .eq("activo", true)
    .eq("oculto_sin_foto", false)
    .eq("tipo", "hotel");
  if (error) throw error;
  return (data ?? []) as { id: number; updated_at: string | null }[];
}

async function paquetesConFecha() {
  const { data, error } = await supabaseServer()
    .from("paquetes")
    .select("slug, actualizado_en")
    .eq("activo", true);
  if (error) throw error;
  return (data ?? []) as { slug: string; actualizado_en: string | null }[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, paquetes] = await Promise.all([productosConFecha(), paquetesConFecha()]);

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/destinos`, changeFrequency: "monthly", priority: 0.9 },
    ...DESTINOS.map(({ slug }) => ({
      url: `${SITE_URL}/destinos/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/nosotros`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/preguntas-frecuentes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/cotizar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/catalogo/hot-sales`, changeFrequency: "weekly", priority: 0.8 },
    ...CATEGORIAS.map(({ slug }) => ({
      url: `${SITE_URL}/catalogo/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...estaticas,
    ...paquetes.map(({ slug, actualizado_en }) => ({
      url: `${SITE_URL}/paquete/${slug}`,
      lastModified: actualizado_en ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...productos.map(({ id, updated_at }) => ({
      url: `${SITE_URL}/producto/${id}`,
      lastModified: updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
