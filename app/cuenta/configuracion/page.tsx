"use client";

import { useEffect, useState } from "react";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { SelectorTema } from "@/components/ui/SelectorTema";
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
      setError("No se pudo guardar. Inténtelo de nuevo.");
      return;
    }
    setGuardado(true);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Configuración</h1>

      <section aria-labelledby="apariencia" className="mt-8 flex flex-col gap-3">
        <div>
          <h2 id="apariencia" className="font-display text-2xl font-bold leading-tight text-ink">Apariencia</h2>
          <p className="mt-1 text-sm text-ink-soft">Claro, oscuro o según su dispositivo.</p>
        </div>
        <SelectorTema />
      </section>

      <section aria-labelledby="perfil" className="mt-10 border-t border-linea pt-8">
        <h2 id="perfil" className="font-display text-2xl font-bold leading-tight text-ink">Perfil</h2>
        <form onSubmit={guardar} className="mt-5 flex flex-col gap-5">
          <Campo etiqueta="Correo" ayuda="El correo de la cuenta no se puede cambiar desde aquí.">
            {(a11y) => <Entrada {...a11y} disabled value={user?.email ?? ""} readOnly />}
          </Campo>
          <Campo etiqueta="Nombre" requerido>
            {(a11y) => (
              <Entrada
                {...a11y}
                autoComplete="name"
                value={nombre}
                disabled={cargandoNombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setGuardado(false);
                }}
              />
            )}
          </Campo>
          {error ? <Aviso>{error}</Aviso> : null}
          {guardado ? <Aviso tono="ok">Cambios guardados.</Aviso> : null}
          <Boton type="submit" tamano="lg" ancho cargando={guardando} disabled={cargandoNombre}>
            Guardar cambios
          </Boton>
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
