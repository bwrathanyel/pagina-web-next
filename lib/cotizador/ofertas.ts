import { fotosDeLaPromo, esTodoIncluido, prioridadOferta, tieneNinoGratis } from "@/lib/promociones/hotSales";
import { montoOrden, precioTarjeta, type PrecioTarjeta } from "@/lib/tarifas";
import { DESTINOS } from "@/lib/cotizador/estado";
import type { Promocion } from "@/types/supabase";

/** Un hotel en la grilla de ofertas de /cotizar: lo justo para la tarjeta. El
 * detalle (tarifas, habitaciones) se pide al abrirlo. */
export interface OfertaHotel {
  hotelId: number;
  /** La fila de `tarifas` que se anuncia (destacada, Hot Sale o flyer). */
  tarifaId: number;
  nombre: string;
  /** Destino de /cotizar ("Isla de Margarita"), no el de la base. */
  destino: string;
  foto: string | null;
  titulo: string | null;
  plan: string | null;
  precio: PrecioTarjeta | null;
  /** Para "Menor precio": el doble por persona y noche; null = no ordena. */
  orden: number | null;
  todoIncluido: boolean;
  ninosGratis: boolean;
  /** Cuántos niños no pagan con la promo (0 si no hay). */
  ninosGratisCantidad: number;
  prioridad: number;
}

const clave = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();

// Los destinos de /cotizar son de cara al cliente; en la base el mismo lugar
// aparece con otro nombre, o por su pueblo ("Chichiriviche" es Morrocoy).
const ALIAS: Record<string, string[]> = {
  "Isla de Margarita": ["margarita", "isla margarita", "isla de margarita"],
  Morrocoy: ["morrocoy", "chichiriviche", "tucacas"],
};
const DESTINO_DE = new Map<string, string>(
  DESTINOS.flatMap((d) => (ALIAS[d] ?? [clave(d)]).map((a) => [a, d] as [string, string])),
);

const cantidadNinoGratis = (p: Promocion) =>
  Math.max(0, (p as Promocion & { nino_gratis?: { cantidad: number } | null }).nino_gratis?.cantidad ?? p.ninos_gratis_cantidad ?? 0);

/** Una oferta por hotel (la de mayor prioridad: niños gratis, todo incluido,
 * el resto y al final solo desayuno; a igual prioridad, el ranking del pool),
 * de todos los destinos de /cotizar. Solo hoteles: son los que tienen
 * habitaciones y tarifas para estimar. */
export function ofertasHoteles(pool: Promocion[]): OfertaHotel[] {
  const porHotel = new Map<number, { p: Promocion; rank: number; destino: string }>();
  pool.forEach((p, rank) => {
    const prod = p.producto;
    if (!prod || prod.tipo !== "hotel") return;
    const destino = DESTINO_DE.get(clave(prod.destino));
    if (!destino) return;
    const actual = porHotel.get(prod.id);
    if (!actual || prioridadOferta(p) < prioridadOferta(actual.p)) porHotel.set(prod.id, { p, rank, destino });
  });
  return [...porHotel.values()]
    .sort((a, b) => prioridadOferta(a.p) - prioridadOferta(b.p) || a.rank - b.rank)
    .map(({ p, destino }) => {
      const precio = precioTarjeta(p);
      return {
        hotelId: p.producto!.id,
        tarifaId: p.id,
        nombre: p.producto!.nombre,
        destino,
        foto: fotosDeLaPromo(p)[0] ?? null,
        titulo: p.titulo ?? null,
        plan: p.plan ?? null,
        precio,
        orden: montoOrden(p),
        todoIncluido: esTodoIncluido(p),
        ninosGratis: tieneNinoGratis(p),
        ninosGratisCantidad: cantidadNinoGratis(p),
        prioridad: prioridadOferta(p),
      };
    });
}
