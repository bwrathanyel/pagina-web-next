"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "@/components/catalogo/TicketCard";
import { fotosDe, esSoloReferencial } from "@/lib/supabase/fotos";
import { useCarritoStore } from "@/lib/carrito/store";
import { useFavoritos } from "@/lib/favoritos/useFavoritos";
import { useAuth } from "@/components/providers/AuthProvider";
import { EditarPromocionModal } from "@/components/admin/EditarPromocionModal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import { formatearPrecioCliente } from "@/lib/utils/formatoPrecio";
import { nombrePromo, precioDobleHero } from "@/lib/tarifas";
import type { Promocion, Tarifa } from "@/types/supabase";

export function PromocionCard({ promocion }: { promocion: Promocion }) {
  const router = useRouter();
  const { agregar, quitar, tieneItem } = useCarritoStore();
  const { esFavorito, toggle } = useFavoritos();
  const { rol, modoEdicion } = useAuth();

  const [titulo, setTitulo] = useState(promocion.titulo);
  const [visible, setVisible] = useState(true);
  const [editando, setEditando] = useState(false);
  const [errorVisibilidad, setErrorVisibilidad] = useState(false);

  // Own photos first, hotel's photos as fallback, never invented — same
  // rule as the current site's fotosDe() priority.
  const fotosPropias = fotosDe(promocion.promocion_fotos);
  const fotosHeredadas = fotosDe(promocion.producto?.producto_fotos);
  const fotos = fotosPropias.length > 0 ? fotosPropias : fotosHeredadas;
  const foto = fotos[0] ?? null;
  const fotosReferenciales =
    fotosPropias.length > 0
      ? esSoloReferencial(promocion.promocion_fotos)
      : esSoloReferencial(promocion.producto?.producto_fotos);
  // DBL en grande: si la fila trae grilla con `dbl`, el precio titular es el
  // doble por persona (así se promociona en redes). Sin `dbl` cae al
  // `precio_texto` de siempre.
  // Nombre "Hotel · Promo" en vivo: `titulo` es un useState que el modal de
  // edición actualiza, por eso se pasa mezclado (no `promocion` a secas).
  const nombre = nombrePromo({ ...promocion, titulo });
  const hero = precioDobleHero({ precios: promocion.precios, moneda: promocion.moneda } as Tarifa);
  const precioLabel = hero
    ? `${hero.monto} ${hero.nota}`
    : (formatearPrecioCliente(promocion.precio_texto) ?? "Consultar disponibilidad");
  const href = promocion.producto ? `/producto/${promocion.producto.id}` : null;
  const key = `promocion-${promocion.id}`;
  const puedeEditar = rol === "admin" && modoEdicion;

  return (
    <>
      <TicketCard
        href={href}
        badge="Promoción"
        nombre={nombre}
        destino={promocion.producto?.destino ?? null}
        fotos={fotos}
        fotosReferenciales={fotosReferenciales}
        cotizarHref={`/cotizar/promocion/${promocion.id}`}
        resumen={promocion.resumen_ia}
        precioLabel={precioLabel}
        precioMuted={!hero && !promocion.precio_texto}
        hotel={
          promocion.producto
            ? { nombre: promocion.producto.nombre, href: `/producto/${promocion.producto.id}` }
            : null
        }
        vigenciaLabel={promocion.vigencia_texto}
        ninosGratis={promocion.ninos_gratis_cantidad}
        oculto={!visible}
        enCarrito={tieneItem(key)}
        onToggleCarrito={() =>
          tieneItem(key)
            ? quitar(key)
            : agregar({
                key,
                tipo: "promocion",
                id: promocion.id,
                nombre,
                destino: promocion.producto?.destino ?? null,
                fotoUrl: foto,
                precioLabel,
                href: href ?? `/carrito`,
              })
        }
        favorito={esFavorito("promocion", promocion.id)}
        onToggleFavorito={async () => {
          const r = await toggle("promocion", promocion.id);
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
                    const { data, error } = await supabaseBrowser().rpc("web_toggle_promocion_visible", {
                      p_id: promocion.id,
                    });
                    if (data?.ok) {
                      try {
                        await revalidarSitioPublico();
                        setVisible(data.revisado);
                      } catch { setErrorVisibilidad(true); }
                    }
                    else if (error) setErrorVisibilidad(true);
                  }}
                  className="min-h-11 flex-1 rounded-full border border-ink/20 text-sm font-semibold text-ink"
                >
                  {visible ? "Ocultar" : "Mostrar"}
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
        <EditarPromocionModal
          promocion={{ ...promocion, titulo }}
          onClose={() => setEditando(false)}
          onGuardado={(c) => setTitulo(c.titulo)}
        />
      ) : null}
    </>
  );
}
