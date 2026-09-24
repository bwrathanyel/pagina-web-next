"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { supabaseBrowser } from "@/lib/supabase/client";

const sinSuscripcion = () => () => {};
const leerConfirmar = () => new URLSearchParams(window.location.search).has("confirmar");

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  // /cuenta/registro manda acá con ?confirmar=1 cuando Supabase pide
  // confirmar el correo antes de abrir sesión.
  const porConfirmar = useSyncExternalStore(sinSuscripcion, leerConfirmar, () => false);

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
    router.push("/cuenta");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Iniciar sesión</h1>
      <p className="mb-8 mt-3 text-ink-soft">Acceda a sus favoritos y a su carrito guardado.</p>

      {porConfirmar ? (
        <Aviso tono="ok" className="mb-6">
          Cuenta creada. Le enviamos un correo: abra el enlace para confirmarla y luego inicie sesión aquí.
        </Aviso>
      ) : null}

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
          <Link href="/cuenta/recuperar" className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-acento underline-offset-4 hover:underline">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {error ? <Aviso>{error}</Aviso> : null}

        <Boton type="submit" tamano="lg" ancho cargando={cargando}>
          Entrar
        </Boton>
      </form>

      <p className="mt-8 border-t border-linea pt-6 text-ink-soft">
        ¿No tiene cuenta?{" "}
        <Link href="/cuenta/registro" className="font-semibold text-acento underline-offset-4 hover:underline">
          Regístrese
        </Link>
      </p>
    </main>
  );
}
