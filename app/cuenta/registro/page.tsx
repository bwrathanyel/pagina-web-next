"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
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

    if (!data.session) {
      setError(null);
      router.push("/cuenta/login?confirmar=1");
      return;
    }

    router.push("/cuenta");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Crear cuenta</h1>
      <p className="mb-8 mt-3 text-ink-soft">Guarde sus favoritos y su carrito entre visitas.</p>

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

      <p className="mt-8 border-t border-linea pt-6 text-ink-soft">
        ¿Ya tiene cuenta?{" "}
        <Link href="/cuenta/login" className="font-semibold text-acento underline-offset-4 hover:underline">
          Inicie sesión
        </Link>
      </p>
    </main>
  );
}
