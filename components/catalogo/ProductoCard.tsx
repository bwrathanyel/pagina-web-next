"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "@/components/catalogo/TicketCard";
import { fotosDe } from "@/lib/supabase/fotos";
import { useCarritoStore } from "@/lib/carrito/store";
import { useFavoritos } from "@/lib/favoritos/useFavoritos";
import { useAuth } from "@/components/providers/AuthProvider";
import { EditarProductoModal } from "@/components/admin/EditarProductoModal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import { formatearPrecioCliente } from "@/lib/utils/formatoPrecio";
import type { Producto } from "@/types/supabase";

export const BADGE_POR_TIPO: Record<Producto["tipo"], string> = {
  hotel: "Hotel",
  paquete: "Paquete",
  destino: "Guía / Tour",
  info: "Info",
};

export function ProductoCard({ producto }: { producto: Producto }) {
  const router = useRouter();
  const { agregar, quitar, tieneItem } = useCarritoStore();
  const { esFavorito, toggle } = useFavoritos();
  const { rol, modoEdicion } = useAuth();

  const [nombre, setNombre] = useState(producto.nombre);
  const [activo, setActivo] = useState(true);
  const [editando, setEditando] = useState(false);
  const [errorVisibilidad, setErrorVisibilidad] = useState(false);

  const fotos = fotosDe(producto.producto_fotos);
  const foto = fotos[0] ?? null;
  const tarifaVigente = producto.tarifas.find((t) => t.vigente);
  const precioLabel = formatearPrecioCliente(tarifaVigente?.precio_texto) ?? "Consultar disponibilidad";
  const href = `/producto/${producto.id}`;
  const key = `producto-${producto.id}`;
  const puedeEditar = rol === "admin" && modoEdicion;

  return (
    <>
      <TicketCard
        href={href}
        badge={BADGE_POR_TIPO[producto.tipo]}
        nombre={nombre}
        destino={producto.destino}
        fotos={fotos}
        cotizarHref={`/cotizar/producto/${producto.id}`}
        precioLabel={precioLabel}
        precioMuted={!tarifaVigente}
        oculto={!activo}
        enCarrito={tieneItem(key)}
        onToggleCarrito={() =>
          tieneItem(key)
            ? quitar(key)
            : agregar({
                key,
                tipo: "producto",
                id: producto.id,
                nombre,
                destino: producto.destino,
                fotoUrl: foto,
                precioLabel,
                href,
              })
        }
        favorito={esFavorito("producto", producto.id)}
        onToggleFavorito={async () => {
          const r = await toggle("producto", producto.id);
          if (r === "login-requerido") router.push("/cuenta/login");
        }}
        pieAdmin={
          puedeEditar ? (
            <div className="mt-3 border-t border-dashed border-ink/15 pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="min-h-11 flex-1 rounded-full border border-ink/20 text-sm font-semibold text-ink"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setErrorVisibilidad(false);
                    const { data, error } = await supabaseBrowser().rpc("web_toggle_producto_activo", {
                      p_id: producto.id,
                    });
                    if (data?.ok) {
                      try {
                        await revalidarSitioPublico();
                        setActivo(data.activo);
                      } catch { setErrorVisibilidad(true); }
                    }
                    else if (error) setErrorVisibilidad(true);
                  }}
                  className="min-h-11 flex-1 rounded-full border border-ink/20 text-sm font-semibold text-ink"
                >
                  {activo ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {errorVisibilidad ? (
                <p className="mt-2 text-xs text-coral">No se pudo cambiar. Inténtalo de nuevo.</p>
              ) : null}
            </div>
          ) : undefined
        }
      />
      {editando ? (
        <EditarProductoModal
          producto={{ ...producto, nombre }}
          onClose={() => setEditando(false)}
          onGuardado={(c) => setNombre(c.nombre)}
        />
      ) : null}
    </>
  );
}
