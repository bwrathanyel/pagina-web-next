import { fotosDe } from "@/lib/supabase/fotos";
import type { Promocion } from "@/types/supabase";

// Mismo fallback que PromocionCard: fotos propias, y solo si no tiene
// ninguna, las del hotel.
export function fotosDeLaPromo(p: Promocion): string[] {
  const propias = fotosDe(p.promocion_fotos);
  return propias.length > 0 ? propias : fotosDe(p.producto?.producto_fotos);
}

// Vigencia: hasta ahora la web NO la filtraba (ver plan Hot Sales manual) y una
// promo vencida aparecía hundida con score 0 pero aparecía. Vigente = ninguna de
// sus dos fechas de fin ya pasó. Fechas 'YYYY-MM-DD' (columnas date de Postgres),
// comparables como string contra la fecha de hoy en ISO.
export function promoVigente(p: Promocion): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  if (p.fecha_venta_fin && p.fecha_venta_fin < hoy) return false;
  if (p.fecha_fin_estimada && p.fecha_fin_estimada < hoy) return false;
  return true;
}

// El pool de Hot Sales sale en dos bloques:
//  1. Manuales: el dueño las forzó desde el CRM (hot_sale_estado === 'poner').
//     Van primero, en el orden que él fijó (hot_sale_orden), sin dedup por hotel
//     y sin mínimo de fotos -- el RPC catalogo_hot_sale_marcar ya garantizó >=1
//     foto al ponerlas. Solo se exige que sigan vigentes: una promo que vence
//     estando forzada cae sola del pool.
//  2. Automáticas: las decide el ranking. Se descartan las excluidas a mano
//     ('quitar') y las no vigentes, se exigen >=2 fotos, y se dedup-ea por hotel
//     -- el array ya viene ordenado por score desc (getPromociones()), así que
//     "la primera de cada hotel" es la de mejor rendimiento. El Set de vistos
//     arranca sembrado con los hoteles del bloque manual: si no, un hotel
//     forzado volvería a entrar por la puerta automática.
export function promosHotSales(promociones: Promocion[]): Promocion[] {
  const vistos = new Set<number | string>();
  const resultado: Promocion[] = [];
  const claveHotel = (p: Promocion) => (p.producto ? p.producto.id : `promo:${p.id}`);

  const manuales = promociones
    .filter((p) => p.hot_sale_estado === "poner" && promoVigente(p))
    .sort((a, b) => (a.hot_sale_orden ?? 1e9) - (b.hot_sale_orden ?? 1e9));
  for (const p of manuales) {
    vistos.add(claveHotel(p));
    resultado.push(p);
  }

  for (const p of promociones) {
    if (p.hot_sale_estado === "poner" || p.hot_sale_estado === "quitar") continue;
    if (!promoVigente(p)) continue;
    const clave = claveHotel(p);
    if (vistos.has(clave)) continue;
    if (fotosDeLaPromo(p).length < 2) continue;
    vistos.add(clave);
    resultado.push(p);
  }
  return resultado;
}

export function destinosDelPool(pool: Promocion[]): string[] {
  const destinos = new Set<string>();
  for (const p of pool) {
    if (p.producto?.destino) destinos.add(p.producto.destino);
  }
  return [...destinos].sort();
}

// Las N ofertas que van en la vitrina de la home: la mejor de cada destino,
// sin repetir destino. El pool ya viene ordenado por score descendente desde
// getPromociones(), asi que alcanza con recorrerlo en orden -- no usar
// agruparPorDestino aca, que reordena alfabeticamente y pierde el ranking. Se
// exigen promo con producto (sin producto no hay destino ni ficha a la que
// linkear) y al menos una foto.
export function ofertasVitrina(pool: Promocion[], cantidad = 4): Promocion[] {
  const destinos = new Set<string>();
  const resultado: Promocion[] = [];
  for (const p of pool) {
    const destino = p.producto?.destino;
    if (!destino || destinos.has(destino)) continue;
    if (fotosDeLaPromo(p).length === 0) continue;
    destinos.add(destino);
    resultado.push(p);
    if (resultado.length === cantidad) break;
  }
  return resultado;
}
