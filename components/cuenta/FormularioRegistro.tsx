"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { AccesoGoogle } from "@/components/cuenta/BotonGoogle";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Google + correo. Lo usan /cuenta/registro y el panel de cuenta del header. */
export function FormularioRegistro({
  siguiente,
  onCreada,
  onPorConfirmar,
}: {
  siguiente: string;
  /** Cuenta creada y con sesión abierta. */
  onCreada: () => void;
  /** Cuenta creada, pero Supabase pide confirmar el correo antes de entrar. */
  onPorConfirmar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const sb = supabaseBrowser();

    const { data, error: signUpError } = await sb.auth.signUp({
      email,
      password,
      // Si el proyecto pide confirmación por correo, no hay sesión todavía
      // y el RPC de abajo (que necesita auth.uid()) no se puede llamar —
      // el nombre viaja en el metadata del usuario para no perderse, y
      // web_crear_perfil() lo lee de ahí como fallback cuando se autocura
      // el perfil en el primer login real (ver AuthProvider).
      options: { data: { nombre } },
    });
    if (signUpError) {
      setCargando(false);
      setError(
        signUpError.message.includes("already registered")
          ? "Ese correo ya tiene una cuenta. Inicie sesión."
          : "No se pudo crear la cuenta. Inténtelo de nuevo.",
      );
      return;
    }

    if (data.session) {
      await sb.rpc("web_crear_perfil", { p_nombre: nombre });
    }

    setCargando(false);
    if (data.session) onCreada();
    else onPorConfirmar();
  }

  return (
    <AccesoGoogle siguiente={siguiente} onError={setError}>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Campo etiqueta="Nombre" requerido>
          {(a11y) => <Entrada {...a11y} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Correo" requerido>
          {(a11y) => (
            <Entrada {...a11y} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <Campo etiqueta="Contraseña" ayuda="Al menos 6 caracteres." requerido>
          {(a11y) => (
            <Entrada
              {...a11y}
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Campo>

        {error ? <Aviso>{error}</Aviso> : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Crear cuenta
        </Boton>
      </form>
    </AccesoGoogle>
  );
}
