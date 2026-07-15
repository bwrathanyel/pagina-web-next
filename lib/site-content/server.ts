import { DEFAULT_SITE_CONTENT, combinarContenido } from "@/lib/site-content/defaults";
import { supabaseServer } from "@/lib/supabase/server";
import type { SiteContent } from "@/lib/site-content/types";

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const { data, error } = await supabaseServer().rpc("web_obtener_contenido", { p_clave: "sitio" });
    if (error) return DEFAULT_SITE_CONTENT;
    return combinarContenido(DEFAULT_SITE_CONTENT, data);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
