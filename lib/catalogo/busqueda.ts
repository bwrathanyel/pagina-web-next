import { esPlanTodoIncluido } from "@/lib/promociones/hotSales";
import { tarifaDestacada } from "@/lib/tarifas";
import type { Producto } from "@/types/supabase";

export const DESTINOS_SUGERIDOS = ["Canaima", "Chichiriviche", "Los Roques", "Margarita", "Mérida"];

// Nullable: hay promociones sin título cargado y un null acá tumbaba /buscar.
/** Minúsculas y sin acentos: "merida" encuentra "Mérida". */
export const normalizarBusqueda = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function coincide(texto: string | null | undefined, query: string): boolean {
  return normalizarBusqueda(texto ?? "").includes(normalizarBusqueda(query));
}

/** Todas las palabras de la consulta deben aparecer, cada una en cualquiera de
 * los campos: "margarita todo incluido" coincide aunque el destino y el plan
 * estén en campos distintos. */
export function coincideTodas(campos: ReadonlyArray<string | null | undefined>, query: string): boolean {
  const palabras = normalizarBusqueda(query).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const pajar = normalizarBusqueda(campos.filter(Boolean).join(" "));
  return palabras.every((p) => pajar.includes(p));
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
