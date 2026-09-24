"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Esqueleto } from "@/components/ui/Esqueleto";

export default function RestablecerPage() {
  const router = useRouter();
  // "verificando" mientras supabase-js procesa el token del enlace: antes se
  // mostraba "Enlace inválido" por un instante aunque el enlace sirviera.
  const [estado, setEstado] = useState<"verificando" | "listo" | "invalido">("verificando");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    // El enlace del correo trae el token de recuperación en la URL — el
    // cliente lo procesa solo (detectSessionInUrl) y dispara este evento
    // o ya deja una sesión activa antes de que el efecto corra.
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setEstado("listo");
    });
    sb.auth.getSession().then(({ data }) => {
      setEstado((actual) => (data.session || actual === "listo" ? "listo" : "invalido"));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setCargando(false);
    if (error) {
      setError("No se pudo actualizar la contraseña. Inténtelo de nuevo.");
      return;
    }
    router.push("/cuenta");
    router.refresh();
  }

  if (estado === "verificando") {
    return (
      <main className="mx-auto max-w-md px-5 py-10 md:py-16" aria-busy="true">
        <span className="sr-only">Verificando el enlace…</span>
        <Esqueleto className="h-10 w-3/4" />
        <Esqueleto className="mt-8 h-12" />
      </main>
    );
  }

  if (estado === "invalido") {
    return (
      <main className="mx-auto max-w-md px-5 py-10 md:py-16">
        <h1 className="font-display text-4xl font-bold leading-none text-ink">Enlace inválido</h1>
        <p className="mt-3 text-ink-soft">
          Este enlace ya venció o no es válido. Pida uno nuevo desde{" "}
          <Link href="/cuenta/recuperar" className="font-semibold text-acento underline-offset-4 hover:underline">
            recuperar contraseña
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Elija una contraseña nueva</h1>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <Campo etiqueta="Contraseña nueva" ayuda="Al menos 6 caracteres." requerido>
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
          Guardar contraseña
        </Boton>
      </form>
    </main>
  );
}
