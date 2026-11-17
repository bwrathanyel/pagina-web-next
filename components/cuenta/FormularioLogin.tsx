"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { AccesoGoogle } from "@/components/cuenta/BotonGoogle";
import { guardarCorreo, leerCorreo, MENSAJE_LIMITE, MENSAJE_RED, tipoErrorAuth } from "@/lib/auth/errores";
import { supabaseBrowser } from "@/lib/supabase/client";
import { guardarRetorno } from "@/lib/utils/rutaInterna";

const sinSuscripcion = () => () => {};

/** Google + correo. Lo usan /cuenta/login y el panel de cuenta del header;
 * qué pasa al entrar lo decide quien lo monta (navegar o cerrar el panel). */
export function FormularioLogin({
  siguiente,
  onEntrar,
  onNavegar,
}: {
  siguiente: string;
  onEntrar: () => void;
  /** Corre al seguir un link (ej. cerrar el panel antes de ir a recuperar). */
  onNavegar?: () => void;
}) {
  // Correo que viene de otro formulario (registro con correo ya existente);
  // lo escrito aquí tiene prioridad.
  const guardado = useSyncExternalStore(sinSuscripcion, leerCorreo, () => "");
  const [escrito, setEmail] = useState<string | null>(null);
  const email = escrito ?? guardado;
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [sinConfirmar, setSinConfirmar] = useState(false);
  const [reenvio, setReenvio] = useState<"no" | "enviando" | "enviado">("no");


  async function reenviar() {
    setReenvio("enviando");
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email });
    if (error) {
      setReenvio("no");
      setError(tipoErrorAuth(error) === "limite" ? MENSAJE_LIMITE : "No pudimos reenviar el correo. Inténtelo en unos minutos.");
      return;
    }
    setError(null);
    setReenvio("enviado");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSinConfirmar(false);
    setReenvio("no");
    setCargando(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      const tipo = tipoErrorAuth(error);
      if (tipo === "sin_confirmar") {
        setSinConfirmar(true);
        setError("Falta confirmar su correo. Abra el enlace que le enviamos o pida otro.");
      } else if (tipo === "limite") setError(MENSAJE_LIMITE);
      else if (tipo === "red") setError(MENSAJE_RED);
      else if (tipo === "credenciales") setError("Correo o contraseña incorrectos.");
      else setError("No pudimos iniciar sesión. Inténtelo de nuevo.");
      return;
    }
    onEntrar();
  }

  return (
    <AccesoGoogle siguiente={siguiente} onError={setError}>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Campo etiqueta="Correo" requerido>
          {(a11y) => (
            <Entrada {...a11y} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <div className="flex flex-col gap-2">
          <Campo etiqueta="Contraseña" requerido>
            {(a11y) => (
              <Entrada
                {...a11y}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Campo>
          <Link
            href="/cuenta/recuperar"
            onClick={() => {
              guardarCorreo(email);
              guardarRetorno(siguiente, 1800);
              onNavegar?.();
            }}
            className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-acento underline-offset-4 hover:underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {error ? <Aviso>{error}</Aviso> : null}
        {sinConfirmar ? (
          reenvio === "enviado" ? (
            <Aviso tono="ok">Le reenviamos el correo. Revise también la carpeta de no deseados.</Aviso>
          ) : (
            <Boton type="button" variante="secundario" ancho cargando={reenvio === "enviando"} onClick={reenviar}>
              Reenviar correo
            </Boton>
          )
        ) : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Entrar
        </Boton>
      </form>
    </AccesoGoogle>
  );
}
