"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "@/components/catalogo/TicketCard";
import { fotosDe, esSoloReferencial } from "@/lib/supabase/fotos";
import { enlaceCotizarPromocion } from "@/lib/cotizador/estado";
import { useCarritoStore } from "@/lib/carrito/store";
import { useFavoritos } from "@/lib/favoritos/useFavoritos";
import { useAuth } from "@/components/providers/AuthProvider";
import { EditarPromocionModal } from "@/components/admin/EditarPromocionModal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import { nombrePromo, precioTarjeta } from "@/lib/tarifas";
import type { HotSale, Promocion } from "@/types/supabase";

const DIAS_URGENCIA = 7;
const sinSuscripcion = () => () => {};

// "3 días / 2 noches", "3 días y 2 noches", "3D/2N" -> "3 días · 2 noches".
// Solo si el texto de la promo lo dice; nunca se deduce de fechas.
function duracionDe(...textos: (string | null | undefined)[]): string | null {
  for (const t of textos) {
    const m = t?.match(/(\d{1,2})\s*d[ií]as?\s*(?:[/·,-]|y)?\s*(\d{1,2})\s*noches?/i);
    if (m) return `${m[1]} ${+m[1] === 1 ? "día" : "días"} · ${m[2]} ${+m[2] === 1 ? "noche" : "noches"}`;
  }
  return null;
}

// Días que quedan de venta según la fecha límite real (YYYY-MM-DD), contados
// desde el día de la persona; null si no hay fecha, ya pasó o falta bastante.
function avisoDeCierre(fechaFin: string | null): string | null {
  const m = fechaFin?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const hoy = new Date();
  const dias = Math.round(
    (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86_400_000,
  );
  if (dias < 0 || dias > DIAS_URGENCIA) return null;
  return dias === 0 ? "Último día" : dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-10-05" -> "5 oct". Se lee del texto, sin Date: no hay zona horaria que lo corra un día.
function fechaCorta(fecha: string | null): string | null {
  const m = fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${MESES[+m[2] - 1]}` : null;
}

export function PromocionCard({ promocion, prioridad = false }: { promocion: Promocion; prioridad?: boolean }) {
  const router = useRouter();
  const { agregar, quitar, tieneItem } = useCarritoStore();
  const { esFavorito, toggle } = useFavoritos();
  const { rol, modoEdicion } = useAuth();

  const [titulo, setTitulo] = useState(promocion.titulo);
  const [visible, setVisible] = useState(true);
  const [editando, setEditando] = useState(false);
  const [errorVisibilidad, setErrorVisibilidad] = useState(false);
  // Después de hidratar: la página puede venir cacheada de otro día, y el
  // aviso depende de "hoy" en el navegador.
  const urgencia = useSyncExternalStore(
    sinSuscripcion,
    () => avisoDeCierre(promocion.fecha_venta_fin),
    () => null,
  );

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
  // Nombre "Hotel · Promo" en vivo: `titulo` es un useState que el modal de
  // edición actualiza, por eso se pasa mezclado (no `promocion` a secas). La
  // tarjeta titula con el hotel (los títulos de promo suelen ser genéricos:
  // "Temporada baja") y pone la oferta debajo, sin repetir el hotel si el
  // título ya empieza con él.
  const nombre = nombrePromo({ ...promocion, titulo });
  // Sin título de promo cargado, mejor decir qué incluye (si hay tags) que
  // el placeholder "Promoción" (no dice nada, ver captura del dueño
  // 2026-09-27). Sin ninguno de los dos, en blanco: inventar contenido sería
  // peor que no mostrar nada.
  const incluye = (promocion.incluye_tags ?? []).filter(Boolean);
  const tituloBase = titulo || (incluye.length > 0 ? `Incluye ${incluye.join(", ").toLocaleLowerCase("es")}` : null);
  const tituloVisible = tituloBase || "Promoción";
  const hotelNombre = promocion.producto?.nombre?.trim() || "";
  const subtituloPromo =
    tituloBase && hotelNombre && tituloBase.toLowerCase().startsWith(hotelNombre.toLowerCase())
      ? tituloBase.slice(hotelNombre.length).replace(/^[\s·:\-–—|]+/, "") || null
      : tituloBase;
  const precio = precioTarjeta(promocion);
  const precioLabel = precio
    ? [precio.desde ? "Desde" : null, precio.monto, precio.unidad].filter(Boolean).join(" ")
    : "Consultar disponibilidad";
  const href = promocion.producto ? `/producto/${promocion.producto.id}` : null;
  const key = `promocion-${promocion.id}`;
  const puedeEditar = rol === "admin" && modoEdicion;

  return (
    <>
      <TicketCard
        href={href}
        prioridad={prioridad}
        nombre={nombre}
        titulo={hotelNombre || tituloVisible}
        destino={promocion.producto?.destino ?? null}
        fotos={fotos}
        fotosReferenciales={fotosReferenciales}
        cotizarHref={enlaceCotizarPromocion(promocion)}
        resumen={promocion.resumen_ia}
        precio={precio}
        subtitulo={hotelNombre ? subtituloPromo : null}
        vigenciaLabel={promocion.vigencia_texto}
        urgencia={urgencia}
        destacada={"manual" in promocion && (promocion as HotSale).manual}
        incluye={incluye.slice(0, 3)}
        ventaHasta={fechaCorta(promocion.fecha_venta_fin)}
        duracion={duracionDe(titulo, promocion.precio_texto, promocion.resumen_ia)}
        ninosGratis={promocion.ninos_gratis_cantidad}
        selloNinoGratis={"nino_gratis" in promocion ? (promocion as HotSale).nino_gratis?.cantidad : null}
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
                <p className="mt-2 text-xs text-peligro">No se pudo cambiar. Inténtelo de nuevo.</p>
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
