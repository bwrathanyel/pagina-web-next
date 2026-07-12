import type { TipoCotizacion } from "@/components/cotizador/types";
import { esFullDayExacto } from "@/lib/fullday-pricing";
import type { ProductoTipo } from "@/types/supabase";

/** Which wizard flow a catalog product should open. 'paquete' (DB tipo)
 * covers both exact Full Day pricing (day-passes/excursions with a
 * FULLDAY_PRECIO_RULES entry) and looser package fichas without one —
 * only the former gets the live total calculator. */
export function tipoCotizacionDe(producto: { tipo: ProductoTipo; nombre: string }): TipoCotizacion {
  if (producto.tipo === "hotel") return "hospedaje";
  if (producto.tipo === "paquete") return esFullDayExacto(producto.nombre) ? "fullday" : "paquete";
  return "paquete";
}
