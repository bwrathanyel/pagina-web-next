"use client";

import { useState } from "react";
import Link from "next/link";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { BotonGoogle, SeparadorO } from "@/components/cuenta/BotonGoogle";
import { supabaseBrowser } from "@/lib/supabase/client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    onEntrar();
  }

  return (
    <>
      <BotonGoogle siguiente={siguiente} onError={setError} />
      <SeparadorO />

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
            onClick={onNavegar}
            className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-acento underline-offset-4 hover:underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {error ? <Aviso>{error}</Aviso> : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Entrar
        </Boton>
      </form>
    </>
  );
}
