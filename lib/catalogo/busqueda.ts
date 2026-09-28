import { esPlanTodoIncluido } from "@/lib/promociones/hotSales";
import { tarifaDestacada } from "@/lib/tarifas";
import type { Producto } from "@/types/supabase";

export const DESTINOS_SUGERIDOS = ["Canaima", "Chichiriviche", "Los Roques", "Margarita", "Mérida"];

// Nullable: hay promociones sin título cargado y un null acá tumbaba /buscar.
export function coincide(texto: string | null | undefined, query: string): boolean {
  return (texto ?? "").toLowerCase().includes(query.toLowerCase());
}

/** Prioridad de un producto suelto (hotel/paquete) en resultados de búsqueda,
 * mismo orden que prioridadOferta() para promociones (niño gratis, después
 * todo incluido, después el resto): el plan de la tarifa destacada dice si es
 * todo incluido; niño gratis no vive en `productos`, así que lo trae el
 * llamador desde Hot Sales (única fuente con ese dato fuera de una promo). */
export function prioridadProducto(producto: Producto, hotelesConNinoGratis: ReadonlySet<number>): number {
  if (hotelesConNinoGratis.has(producto.id)) return 0;
  if (esPlanTodoIncluido(tarifaDestacada(producto)?.plan, producto.nombre)) return 1;
  return 2;
}
