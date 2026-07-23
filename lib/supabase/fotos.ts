import type { Foto } from "@/types/supabase";

const FOTOS_BASE =
  "https://begbjhrdbsqftbbleecb.supabase.co/storage/v1/object/public/tarifario-fotos/";

/** Same ordering rule as lotus-crm-preview/app.js and the current site's
 * cart.js: active photos only, es_principal first, then orden. Never
 * invent a photo for a product without one — callers get [] and must
 * handle the empty state explicitly. */
export function ordenarFotos(fotos: Foto[] | null | undefined): Foto[] {
  return (fotos ?? [])
    .filter((f) => f.activo !== false)
    .slice()
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden);
}

export function fotoUrl(storagePath: string): string {
  return FOTOS_BASE + storagePath;
}

export function fotosDe(fotos: Foto[] | null | undefined): string[] {
  return ordenarFotos(fotos).map((f) => fotoUrl(f.storage_path));
}

/** true solo cuando TODAS las fotos activas de este grupo son generadas por
 * IA (origen='ia_referencial') -- pasa por acá únicamente cuando el
 * producto/promoción no tenía NINGUNA foto real (ver generar-foto-referencial).
 * Nunca hay mezcla real+referencial: si hay al menos una foto real, esta
 * función da false. */
export function esSoloReferencial(fotos: Foto[] | null | undefined): boolean {
  const activas = ordenarFotos(fotos);
  return activas.length > 0 && activas.every((f) => f.origen === "ia_referencial");
}
