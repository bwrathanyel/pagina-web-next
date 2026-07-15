"use client";

import { useState } from "react";
import Link from "next/link";
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
      setError("No se pudo enviar el correo. Inténtalo de nuevo.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Revisá tu correo</h1>
        <p className="text-ink-soft">
          Si el correo tiene una cuenta asociada, te enviamos un enlace para restablecer la contraseña.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Recuperar contraseña</h1>
      <p className="mb-6 text-ink-soft">Te mandamos un enlace a tu correo para elegir una nueva.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

        {error ? <p className="text-sm text-coral">{error}</p> : null}

        <button
          type="submit"
          disabled={cargando}
          className="min-h-11 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-60"
        >
          {cargando ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/cuenta/login" className="font-semibold text-coral">
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
