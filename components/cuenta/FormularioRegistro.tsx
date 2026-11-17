"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { AccesoGoogle } from "@/components/cuenta/BotonGoogle";
import { guardarCorreo, MENSAJE_LIMITE, MENSAJE_RED, tipoErrorAuth } from "@/lib/auth/errores";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Google + correo. Lo usan /cuenta/registro y el panel de cuenta del header. */
export function FormularioRegistro({
  siguiente,
  onCreada,
  onPorConfirmar,
  onYaExiste,
}: {
  siguiente: string;
  /** Cuenta creada y con sesión abierta. */
  onCreada: () => void;
  /** Cuenta creada, pero Supabase pide confirmar el correo antes de entrar. */
  onPorConfirmar: () => void;
  /** El correo ya tiene cuenta: pasa a «Entrar» con el correo cargado. */
  onYaExiste?: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [yaExiste, setYaExiste] = useState(false);

  function irAEntrar() {
    guardarCorreo(email);
    onYaExiste?.();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setYaExiste(false);
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
      const tipo = tipoErrorAuth(signUpError);
      if (tipo === "ya_existe") setYaExiste(true);
      else if (tipo === "limite") setError(MENSAJE_LIMITE);
      else if (tipo === "red") setError(MENSAJE_RED);
      else setError("No se pudo crear la cuenta. Inténtelo de nuevo.");
      return;
    }
    // Con confirmación por correo activa, un correo ya registrado no da error:
    // Supabase devuelve un usuario sin identidades (y no manda ningún correo).
    if (data.user && data.user.identities?.length === 0) {
      setCargando(false);
      setYaExiste(true);
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
        {yaExiste ? (
          <Aviso tono="info">
            Ese correo ya tiene una cuenta.
            {onYaExiste ? (
              <>
                {" "}
                <button
                  type="button"
                  onClick={irAEntrar}
                  className="inline-flex min-h-11 items-center font-semibold text-acento underline-offset-4 hover:underline"
                >
                  Entrar con este correo
                </button>
              </>
            ) : (
              " Inicie sesión."
            )}
          </Aviso>
        ) : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Crear cuenta
        </Boton>
      </form>
    </AccesoGoogle>
  );
}
