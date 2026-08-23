import { fotosDe } from "@/lib/supabase/fotos";
import type { Promocion } from "@/types/supabase";

// Mismo fallback que PromocionCard: fotos propias, y solo si no tiene
// ninguna, las del hotel.
export function fotosDeLaPromo(p: Promocion): string[] {
  const propias = fotosDe(p.promocion_fotos);
  return propias.length > 0 ? propias : fotosDe(p.producto?.producto_fotos);
}

// Agrupa por hotel (producto.id, o la propia promocion.id si es una promo
// suelta sin hotel) y se queda con la primera de cada grupo -- el array de
// entrada ya viene ordenado por precio ascendente (getPromociones()), así que
// "la primera" es "la más barata". Mismo criterio de dedup-por-hotel que ya
// usa cotizador-chat (nunca 2 tarjetas del mismo hotel).
// Se descartan las promos con menos de 2 fotos -- una tarjeta sin fotos (o
// con una sola) se ve pobre al lado de las demás en esta sección.
export function promosHotSales(promociones: Promocion[]): Promocion[] {
  const vistos = new Set<number | string>();
  const resultado: Promocion[] = [];
  for (const p of promociones) {
    const clave = p.producto ? p.producto.id : `promo:${p.id}`;
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

// Las N ofertas que van en la vitrina de la home: la mas barata de cada
// destino, sin repetir destino. El pool ya viene ordenado por precio
// ascendente desde getPromociones(), asi que alcanza con recorrerlo en orden
// -- no usar agruparPorDestino aca, que reordena alfabeticamente y pierde el
// criterio de precio. Se exigen promo con producto (sin producto no hay
// destino ni ficha a la que linkear) y al menos una foto.
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
