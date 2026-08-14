"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
          ? "Ese correo ya tiene una cuenta — iniciá sesión."
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
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
    <main className="mx-auto max-w-md px-5 py-8 md:py-12">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Crear cuenta</h1>
      <p className="mb-6 text-ink-soft">Guardá favoritos y tu carrito entre visitas.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-semibold text-ink">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            required
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink"
          />
        </div>

        {error ? <p className="text-sm text-coral">{error}</p> : null}

        <button
          type="submit"
          disabled={cargando}
          className="min-h-11 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-60"
        >
          {cargando ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/login" className="font-semibold text-coral">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
