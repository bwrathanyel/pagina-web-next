"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { create } from "zustand";

export type TipoFavorito = "producto" | "promocion";

const CLAVE = "lotus:favorito-pendiente";
/** Evento que avisa a cada `useFavoritos` montado que un favorito cambió fuera de su toggle. */
export const EVENTO_FAVORITO = "lotus:favorito";
export type DetalleFavorito = { tipo: TipoFavorito; id: number; activo: boolean };

/** Aviso corto y global (lo pinta `AvisoFavorito`, montado en el Navbar). */
export const useAvisoFavorito = create<{
  aviso: { tono: "ok" | "error"; texto: string } | null;
  mostrar: (tono: "ok" | "error", texto: string) => void;
  cerrar: () => void;
}>()((set) => ({
  aviso: null,
  mostrar: (tono, texto) => set({ aviso: { tono, texto } }),
  cerrar: () => set({ aviso: null }),
}));

/** Sin sesión: se recuerda qué favorito quiso marcar para aplicarlo al entrar. */
export function guardarFavoritoPendiente(tipo: TipoFavorito, id: number): void {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify({ tipo, id }));
  } catch {
    /* sin sessionStorage: la persona tendrá que volver a tocar el corazón */
  }
}

function leerPendiente(): { tipo: TipoFavorito; id: number } | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const p = JSON.parse(crudo) as { tipo?: string; id?: unknown };
    if ((p.tipo === "producto" || p.tipo === "promocion") && typeof p.id === "number") return { tipo: p.tipo, id: p.id };
  } catch {
    /* valor roto: se descarta abajo */
  }
  return null;
}

/** Al haber sesión: guarda el favorito pendiente (si lo hay) y lo avisa. Se
 * lee y borra antes de esperar a Supabase, así dos llamadas seguidas no lo
 * insertan dos veces. */
export async function aplicarFavoritoPendiente(usuarioId: string): Promise<void> {
  const pendiente = leerPendiente();
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que limpiar */
  }
  if (!pendiente) return;
  const columna = pendiente.tipo === "producto" ? "producto_id" : "promocion_id";
  const sb = supabaseBrowser();
  const { data, error: errorLectura } = await sb
    .from("web_favoritos")
    .select("usuario_id")
    .eq("usuario_id", usuarioId)
    .eq(columna, pendiente.id)
    .limit(1);
  const yaEra = !errorLectura && (data?.length ?? 0) > 0;
  const { error } = yaEra ? { error: null } : await sb.from("web_favoritos").insert({ usuario_id: usuarioId, [columna]: pendiente.id });
  if (error) {
    useAvisoFavorito.getState().mostrar("error", "No pudimos guardar su favorito. Toque el corazón otra vez.");
    return;
  }
  window.dispatchEvent(
    new CustomEvent<DetalleFavorito>(EVENTO_FAVORITO, { detail: { tipo: pendiente.tipo, id: pendiente.id, activo: true } }),
  );
  useAvisoFavorito.getState().mostrar("ok", "Guardamos su favorito.");
}
