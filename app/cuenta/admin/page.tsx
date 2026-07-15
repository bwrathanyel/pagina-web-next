"use client";

import { useEffect, useState } from "react";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PRODUCTO_SELECT, PROMOCION_SELECT } from "@/lib/supabase/queries";
import type { Producto, Promocion } from "@/types/supabase";

type ProductoAdmin = Producto & { activo: boolean };
type PromocionAdmin = Promocion & { revisado: boolean };

async function consultarCatalogoAdmin(): Promise<{
  productos: ProductoAdmin[];
  promociones: PromocionAdmin[];
}> {
  const sb = supabaseBrowser();
  const [{ data: prods, error: e1 }, { data: promos, error: e2 }] = await Promise.all([
    sb.from("productos").select(`${PRODUCTO_SELECT},activo`).order("nombre"),
    sb.from("promociones").select(`${PROMOCION_SELECT},revisado`).order("titulo"),
  ]);
  if (e1 || e2) throw new Error("catalogo-no-disponible");
  return {
    productos: (prods ?? []) as unknown as ProductoAdmin[],
    promociones: (promos ?? []) as unknown as PromocionAdmin[],
  };
}

/** Panel de administración: lista TODO (activo u oculto), sin el filtro que
 * usa el catálogo público — es el único lugar donde "Mostrar" de nuevo algo
 * que se ocultó es siempre alcanzable, sin depender de que el ítem oculto
 * aparezca en un listado que por diseño lo filtra. */
function PanelAdmin() {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [promociones, setPromociones] = useState<PromocionAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await consultarCatalogoAdmin();
      setProductos(resultado.productos);
      setPromociones(resultado.promociones);
    } catch {
      setError("No se pudo cargar el catálogo completo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let vigente = true;
    consultarCatalogoAdmin()
      .then((resultado) => {
        if (!vigente) return;
        setProductos(resultado.productos);
        setPromociones(resultado.promociones);
      })
      .catch(() => {
        if (vigente) setError("No se pudo cargar el catálogo completo.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  async function toggleProducto(id: number) {
    const { data } = await supabaseBrowser().rpc("web_toggle_producto_activo", { p_id: id });
    if (data?.ok) setProductos((s) => s.map((p) => (p.id === id ? { ...p, activo: data.activo } : p)));
  }

  async function togglePromocion(id: number) {
    const { data } = await supabaseBrowser().rpc("web_toggle_promocion_visible", { p_id: id });
    if (data?.ok) setPromociones((s) => s.map((p) => (p.id === id ? { ...p, revisado: data.revisado } : p)));
  }

  if (cargando) return <p className="text-ink-soft">Cargando…</p>;
  if (error) {
    return (
      <div>
        <p className="mb-3 text-coral">{error}</p>
        <button type="button" onClick={cargar} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          Productos ({productos.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {productos.map((p) => (
            <li
              key={p.id}
              className={
                "flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-card px-4 py-3 " +
                (!p.activo ? "opacity-50" : "")
              }
            >
              <span className="text-ink">
                {p.nombre} <span className="text-ink-soft">— {p.destino ?? "sin destino"}</span>
              </span>
              <button
                type="button"
                onClick={() => toggleProducto(p.id)}
                className="min-h-11 flex-shrink-0 rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink"
              >
                {p.activo ? "Ocultar" : "Mostrar"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          Promociones ({promociones.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {promociones.map((p) => (
            <li
              key={p.id}
              className={
                "flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-card px-4 py-3 " +
                (!p.revisado ? "opacity-50" : "")
              }
            >
              <span className="text-ink">{p.titulo}</span>
              <button
                type="button"
                onClick={() => togglePromocion(p.id)}
                className="min-h-11 flex-shrink-0 rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink"
              >
                {p.revisado ? "Ocultar" : "Mostrar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PanelAdminGate() {
  const { rol, cargando } = useAuth();
  if (cargando) return <p className="text-ink-soft">Cargando…</p>;
  if (rol !== "admin") {
    return <p className="text-ink-soft">Esta sección es solo para administradores.</p>;
  }
  return <PanelAdmin />;
}

export default function AdminPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
          Panel de administración
        </h1>
        <PanelAdminGate />
      </main>
    </RequiereSesion>
  );
}
