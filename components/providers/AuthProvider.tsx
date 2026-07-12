"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

type Rol = "user" | "admin";

interface AuthContextValue {
  user: User | null;
  rol: Rol | null;
  cargando: boolean;
  /** Admin-only: el "Modo Edición" de la UI es un toggle aparte de estar
   * logueado como admin — un admin navega normal por defecto y prende
   * edición cuando la necesita, no al revés. */
  modoEdicion: boolean;
  setModoEdicion: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);

  // onAuthStateChange puede disparar varias veces seguidas (ej. logout
  // mientras un cargarPerfil anterior sigue en vuelo) — sin esta guarda,
  // la resolución vieja puede pisar el rol del estado nuevo (o del próximo
  // usuario en un dispositivo compartido) al llegar tarde.
  const peticionActual = useRef(0);

  const cargarPerfil = useCallback(async (uid: string | undefined) => {
    const idPeticion = ++peticionActual.current;
    if (!uid) {
      setRol(null);
      return;
    }
    const sb = supabaseBrowser();
    const { data } = await sb.from("web_perfiles").select("rol").eq("id", uid).maybeSingle();
    if (idPeticion !== peticionActual.current) return;
    if (data) {
      setRol(data.rol as Rol);
      return;
    }
    // Perfil ausente: pasa cuando el signUp() pide confirmación por correo
    // y web_crear_perfil() no se pudo llamar en ese momento (sin sesión
    // todavía). Se autocura acá, la primera vez que hay sesión real.
    const { data: creado } = await sb.rpc("web_crear_perfil", { p_nombre: null });
    if (idPeticion !== peticionActual.current) return;
    setRol((creado?.rol as Rol | undefined) ?? "user");
  }, []);

  useEffect(() => {
    const sb = supabaseBrowser();

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      cargarPerfil(data.user?.id).finally(() => setCargando(false));
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      cargarPerfil(session?.user?.id);
      if (!session?.user) setModoEdicion(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [cargarPerfil]);

  const signOut = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    setModoEdicion(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, rol, cargando, modoEdicion, setModoEdicion, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
