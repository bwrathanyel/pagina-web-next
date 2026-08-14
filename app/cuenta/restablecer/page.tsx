"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RestablecerPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    // El enlace del correo trae el token de recuperación en la URL — el
    // cliente lo procesa solo (detectSessionInUrl) y dispara este evento
    // o ya deja una sesión activa antes de que el efecto corra.
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setListo(true);
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setListo(true);
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
      setError("No se pudo actualizar la contraseña. Inténtalo de nuevo.");
      return;
    }
    router.push("/cuenta");
    router.refresh();
  }

  if (!listo) {
    return (
      <main className="mx-auto max-w-md px-5 py-8 md:py-12">
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Enlace inválido</h1>
        <p className="text-ink-soft">
          Este enlace ya venció o no es válido. Pedí uno nuevo desde{" "}
          <a href="/cuenta/recuperar" className="font-semibold text-coral">
            recuperar contraseña
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8 md:py-12">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Elige una nueva contraseña</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
            Contraseña nueva
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
          {cargando ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
