"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePaneles } from "@/lib/layout/paneles";
import {
  EVENTO_FAVORITO,
  guardarFavoritoPendiente,
  useAvisoFavorito,
  type DetalleFavorito,
  type TipoFavorito,
} from "@/lib/favoritos/pendiente";

const ESPERA_AUTH_MAX_MS = 4000;
type EstadoFavoritos = { usuarioId: string | null; valores: Set<string> };

/** Favoritos del usuario logueado. Sin sesión, esFavorito() siempre
 * devuelve null (no false) para que el corazón se muestre "vacío" sin
 * afirmar un estado que no se puede saber. toggle() espera a que termine de
 * cargar la sesión; sin sesión abre la hoja de cuenta, deja el favorito
 * pendiente en sessionStorage (se aplica al entrar, ver AvisoFavorito) y
 * devuelve "pendiente"; si Supabase falla, avisa y devuelve "error".
 * "login-requerido" queda en el tipo por los callers viejos, ya no se emite. */
export function useFavoritos() {
  const { user, cargando } = useAuth();
  // toggle() lee la sesión más reciente (no la de su closure) tras esperar a `cargando`.
  const authRef = useRef({ user, cargando });
  useEffect(() => {
    authRef.current = { user, cargando };
  }, [user, cargando]);
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

  // Un favorito aplicado fuera de toggle() (el pendiente al iniciar sesión).
  useEffect(() => {
    const alAplicar = (e: Event) => {
      const { tipo, id, activo } = (e as CustomEvent<DetalleFavorito>).detail;
      const actual = favoritosRef.current;
      if (!actual.usuarioId) return;
      const valores = new Set(actual.valores);
      if (activo) valores.add(`${tipo}-${id}`);
      else valores.delete(`${tipo}-${id}`);
      favoritosRef.current = { usuarioId: actual.usuarioId, valores };
      setFavoritos({ usuarioId: actual.usuarioId, valores: new Set(valores) });
    };
    window.addEventListener(EVENTO_FAVORITO, alAplicar);
    return () => window.removeEventListener(EVENTO_FAVORITO, alAplicar);
  }, []);

  const esFavorito = useCallback(
    (tipo: TipoFavorito, id: number): boolean | null => {
      if (!user || favoritos.usuarioId !== user.id) return null;
      return favoritos.valores.has(`${tipo}-${id}`);
    },
    [favoritos, user],
  );

  const toggle = useCallback(
    async (tipo: TipoFavorito, id: number): Promise<"ok" | "login-requerido" | "pendiente" | "error"> => {
      const limite = Date.now() + ESPERA_AUTH_MAX_MS;
      while (authRef.current.cargando && Date.now() < limite) {
        await new Promise((r) => window.setTimeout(r, 100));
      }
      const user = authRef.current.user;
      if (!user) {
        if (authRef.current.cargando) {
          useAvisoFavorito.getState().mostrar("error", "No pudimos comprobar su sesión. Intente de nuevo.");
          return "error";
        }
        guardarFavoritoPendiente(tipo, id);
        usePaneles.getState().abrirCuenta();
        return "pendiente";
      }
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
        useAvisoFavorito.getState().mostrar("error", "No pudimos guardar su favorito. Intente de nuevo.");
        return "error";
      }

      return "ok";
    },
    [],
  );

  return { esFavorito, toggle };
}
