"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

type TipoFavorito = "producto" | "promocion";
type EstadoFavoritos = { usuarioId: string | null; valores: Set<string> };

/** Favoritos del usuario logueado. Sin sesión, esFavorito() siempre
 * devuelve null (no false) para que el corazón se muestre "vacío" sin
 * afirmar un estado que no se puede saber, y toggle() devuelve
 * "login-requerido" para que el caller mande a /cuenta/login. */
export function useFavoritos() {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<EstadoFavoritos>({
    usuarioId: null,
    valores: new Set(),
  });
  // Espejo sincrónico del Set — toggle() lo lee/escribe antes de esperar la
  // respuesta de Supabase, así dos clicks seguidos (antes de que React
  // re-renderice) no leen el mismo closure viejo y no pisan un insert con
  // otro insert (choca con web_favoritos_unico) ni un delete con otro delete.
  const favoritosRef = useRef<EstadoFavoritos>({ usuarioId: null, valores: new Set() });

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    supabaseBrowser()
      .from("web_favoritos")
      .select("producto_id, promocion_id")
      .eq("usuario_id", user.id)
      .then(({ data, error }) => {
        if (!vigente || error || !data) return;
        const s = new Set<string>();
        for (const f of data as { producto_id: number | null; promocion_id: number | null }[]) {
          if (f.producto_id) s.add(`producto-${f.producto_id}`);
          if (f.promocion_id) s.add(`promocion-${f.promocion_id}`);
        }
        const siguiente = { usuarioId: user.id, valores: s };
        favoritosRef.current = siguiente;
        setFavoritos(siguiente);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  const esFavorito = useCallback(
    (tipo: TipoFavorito, id: number): boolean | null => {
      if (!user || favoritos.usuarioId !== user.id) return null;
      return favoritos.valores.has(`${tipo}-${id}`);
    },
    [favoritos, user],
  );

  const toggle = useCallback(
    async (tipo: TipoFavorito, id: number): Promise<"ok" | "login-requerido"> => {
      if (!user) return "login-requerido";
      const key = `${tipo}-${id}`;
      const sb = supabaseBrowser();
      const columna = tipo === "producto" ? "producto_id" : "promocion_id";
      const valores =
        favoritosRef.current.usuarioId === user.id
          ? new Set(favoritosRef.current.valores)
          : new Set<string>();
      const yaEsFavorito = valores.has(key);

      if (yaEsFavorito) {
        valores.delete(key);
      } else {
        valores.add(key);
      }
      favoritosRef.current = { usuarioId: user.id, valores };
      setFavoritos({ usuarioId: user.id, valores: new Set(valores) });

      const { error } = yaEsFavorito
        ? await sb.from("web_favoritos").delete().eq("usuario_id", user.id).eq(columna, id)
        : await sb.from("web_favoritos").insert({ usuario_id: user.id, [columna]: id });

      if (error) {
        // Revierte el optimista — evita quedar desincronizado del server.
        if (yaEsFavorito) valores.add(key);
        else valores.delete(key);
        favoritosRef.current = { usuarioId: user.id, valores };
        setFavoritos({ usuarioId: user.id, valores: new Set(valores) });
      }

      return "ok";
    },
    [user],
  );

  return { esFavorito, toggle };
}
