"use client";

import { useEffect, useState } from "react";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabaseBrowser } from "@/lib/supabase/client";

function ConfiguracionForm() {
  const { user } = useAuth();
  const [nombre, setNombre] = useState("");
  const [cargandoNombre, setCargandoNombre] = useState(true);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    supabaseBrowser()
      .from("web_perfiles")
      .select("nombre")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!vigente) return;
        setNombre(data?.nombre ?? "");
        setCargandoNombre(false);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    setGuardando(true);
    setGuardado(false);
    setError(null);
    const { error: rpcError } = await supabaseBrowser().rpc("web_actualizar_perfil", { p_nombre: nombre });
    setGuardando(false);
    if (rpcError) {
      setError("No se pudo guardar. Probá de nuevo.");
      return;
    }
    setGuardado(true);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Configuración</h1>

      <section className="mb-8 flex items-center justify-between rounded-xl border border-ink/10 bg-card px-4 py-4">
        <div>
          <p className="font-semibold text-ink">Apariencia</p>
          <p className="text-sm text-ink-soft">Modo claro u oscuro</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="rounded-xl border border-ink/10 bg-card p-4">
        <p className="mb-3 font-semibold text-ink">Perfil</p>
        <form onSubmit={guardar} className="flex flex-col gap-3">
          <div>
            <label htmlFor="correo" className="mb-1.5 block text-sm font-semibold text-ink">
              Correo
            </label>
            <input
              id="correo"
              disabled
              value={user?.email ?? ""}
              className="w-full rounded-xl border border-ink/15 bg-sand-2 px-4 py-3 text-base text-ink-soft"
            />
          </div>
          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-sm font-semibold text-ink">
              Nombre
            </label>
            <input
              id="nombre"
              value={nombre}
              disabled={cargandoNombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink disabled:opacity-60"
            />
          </div>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button
            type="submit"
            disabled={guardando || cargandoNombre}
            className="min-h-11 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-60"
          >
            {guardando ? "Guardando…" : guardado ? "Guardado ✓" : "Guardar cambios"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function ConfiguracionPage() {
  return (
    <RequiereSesion>
      <ConfiguracionForm />
    </RequiereSesion>
  );
}
