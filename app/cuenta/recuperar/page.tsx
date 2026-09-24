"use client";

import { useState } from "react";
import Link from "next/link";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta/restablecer`,
    });
    setCargando(false);
    if (error) {
      setError("No se pudo enviar el correo. Inténtelo de nuevo.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 md:py-16">
        <h1 className="font-display text-4xl font-bold leading-none text-ink">Revise su correo</h1>
        <p className="mt-3 text-ink-soft">
          Si el correo tiene una cuenta asociada, le enviamos un enlace para restablecer la contraseña.
        </p>
        <p className="mt-8 border-t border-linea pt-6">
          <Link href="/cuenta/login" className="font-semibold text-acento underline-offset-4 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Recuperar contraseña</h1>
      <p className="mb-8 mt-3 text-ink-soft">Le enviamos un enlace a su correo para elegir una contraseña nueva.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Campo etiqueta="Correo" requerido>
          {(a11y) => (
            <Entrada {...a11y} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>

        {error ? <Aviso>{error}</Aviso> : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Enviar enlace
        </Boton>
      </form>

      <p className="mt-8 border-t border-linea pt-6">
        <Link href="/cuenta/login" className="font-semibold text-acento underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
