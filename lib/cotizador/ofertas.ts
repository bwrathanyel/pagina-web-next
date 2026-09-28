import { fotosDeLaPromo, esTodoIncluido, prioridadOferta, tieneNinoGratis } from "@/lib/promociones/hotSales";
import { montoConMoneda, montoOrden, precioTarjeta, type PrecioTarjeta } from "@/lib/tarifas";
import { DESTINOS } from "@/lib/cotizador/estado";
import type { NinoGratis, Promocion } from "@/types/supabase";

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
  /** Fotos para pasar al posar el mouse (la primera es `foto`). */
  fotos: string[];
  /** Hay fotos por habitación: vale la pena abrir el detalle para elegir.
   * Sin ellas, tocar la oferta elige el hotel con su tarifa anunciada. */
  conFotosHabitacion: boolean;
  titulo: string | null;
  plan: string | null;
  /** Descripción corta (resumen_ia): rellena la línea bajo el nombre cuando
   * no hay `plan` (promos cargadas a mano, sin grilla de habitaciones). */
  resumen: string | null;
  precio: PrecioTarjeta | null;
  /** Para "Menor precio": el doble por persona y noche; null = no ordena. */
  orden: number | null;
  todoIncluido: boolean;
  ninosGratis: boolean;
  /** Cuántos niños no pagan con la promo (0 si no hay). */
  ninosGratisCantidad: number;
  /** Edades del regalo ("2 a 11") según el PDF, si las dice. */
  ninosGratisEdades: string | null;
  /** Lo que paga el niño que no entra en el regalo (tarifa chd de la grilla),
   * ya formateado por noche; null si la tarifa no la trae. */
  precioNino: string | null;
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

type ConNino = Promocion & { nino_gratis?: NinoGratis | null };

const cantidadNinoGratis = (p: ConNino) => Math.max(0, p.nino_gratis?.cantidad ?? p.ninos_gratis_cantidad ?? 0);

// La grilla trae el niño como chd, chd_4_10, chd_2_11…: el más barato manda.
function precioNino(p: Promocion): string | null {
  const precios = p.precios;
  if (!precios || typeof precios !== "object") return null;
  const montos = Object.entries(precios)
    .filter(([k]) => /^chd/i.test(k))
    .map(([, v]) => Number(String(v ?? "").replace(/[^\d.]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!montos.length) return null;
  const moneda = String(p.moneda || "USD").toUpperCase() === "EUR" ? "EUR" : "USD";
  return montoConMoneda(Math.min(...montos), moneda);
}

/** Una oferta por hotel (la de mayor prioridad: niños gratis, todo incluido,
 * el resto y al final solo desayuno; a igual prioridad, el ranking del pool),
 * de todos los destinos de /cotizar. Solo hoteles: son los que tienen
 * habitaciones y tarifas para estimar. */
export function ofertasHoteles(pool: ConNino[]): OfertaHotel[] {
  const porHotel = new Map<number, { p: ConNino; rank: number; destino: string }>();
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
      const fotos = fotosDeLaPromo(p).slice(0, 8);
      return {
        hotelId: p.producto!.id,
        tarifaId: p.id,
        nombre: p.producto!.nombre,
        destino,
        foto: fotos[0] ?? null,
        fotos,
        conFotosHabitacion: (p.producto!.producto_fotos ?? []).some((f) => f.habitacion_id != null && f.activo !== false),
        titulo: p.titulo ?? null,
        plan: p.plan ?? null,
        resumen: p.resumen_ia ?? null,
        precio,
        orden: montoOrden(p),
        todoIncluido: esTodoIncluido(p),
        ninosGratis: tieneNinoGratis(p),
        ninosGratisCantidad: cantidadNinoGratis(p),
        ninosGratisEdades: p.nino_gratis?.edades?.trim().replace(/\s*-\s*/, " a ") || null,
        precioNino: precioNino(p),
        prioridad: prioridadOferta(p),
      };
    });
}
