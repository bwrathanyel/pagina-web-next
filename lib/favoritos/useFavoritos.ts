"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

type TipoFavorito = "producto" | "promocion";

/** Favoritos del usuario logueado. Sin sesión, esFavorito() siempre
 * devuelve null (no false) para que el corazón se muestre "vacío" sin
 * afirmar un estado que no se puede saber, y toggle() devuelve
 * "login-requerido" para que el caller mande a /cuenta/login. */
export function useFavoritos() {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  // Espejo sincrónico del Set — toggle() lo lee/escribe antes de esperar la
  // respuesta de Supabase, así dos clicks seguidos (antes de que React
  // re-renderice) no leen el mismo closure viejo y no pisan un insert con
  // otro insert (choca con web_favoritos_unico) ni un delete con otro delete.
  const favoritosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      favoritosRef.current = new Set();
      setFavoritos(new Set());
      return;
    }
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
        favoritosRef.current = s;
        setFavoritos(s);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  const esFavorito = useCallback(
    (tipo: TipoFavorito, id: number): boolean | null => (user ? favoritos.has(`${tipo}-${id}`) : null),
    [favoritos, user],
  );

  const toggle = useCallback(
    async (tipo: TipoFavorito, id: number): Promise<"ok" | "login-requerido"> => {
      if (!user) return "login-requerido";
      const key = `${tipo}-${id}`;
      const sb = supabaseBrowser();
      const columna = tipo === "producto" ? "producto_id" : "promocion_id";
      const yaEsFavorito = favoritosRef.current.has(key);

      if (yaEsFavorito) {
        favoritosRef.current.delete(key);
      } else {
        favoritosRef.current.add(key);
      }
      setFavoritos(new Set(favoritosRef.current));

      const { error } = yaEsFavorito
        ? await sb.from("web_favoritos").delete().eq("usuario_id", user.id).eq(columna, id)
        : await sb.from("web_favoritos").insert({ usuario_id: user.id, [columna]: id });

      if (error) {
        // Revierte el optimista — evita quedar desincronizado del server.
        if (yaEsFavorito) favoritosRef.current.add(key);
        else favoritosRef.current.delete(key);
        setFavoritos(new Set(favoritosRef.current));
      }

      return "ok";
    },
    [user],
  );

  return { esFavorito, toggle };
}
